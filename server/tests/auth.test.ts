import request from "supertest";
import jwt from "jsonwebtoken";
import { User } from "../src/models/User";
import type { RunningServer } from "../src/server";
import { clearDb, registerUser, startTestServer, stopTestServer, testConfig } from "./helpers";

let server: RunningServer;
const valid = { username: "alice", email: "alice@example.test", password: "password123" };

beforeAll(async () => {
  server = await startTestServer("auth-test");
});
afterAll(() => stopTestServer(server));
beforeEach(clearDb);

describe("POST /api/auth/register", () => {
  it("creates a user, returns a token and never exposes the password", async () => {
    const res = await request(server.httpServer).post("/api/auth/register").send(valid);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe(true);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.username).toBe("alice");
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
    const stored = await User.findOne({ username: "alice" });
    expect(stored?.passwordHash).not.toBe(valid.password);
    expect(stored?.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it.each([
    [{ ...valid, username: "ab" }, "Username must be at least 3 characters"],
    [{ ...valid, email: "not-an-email" }, "Email is invalid"],
    [{ ...valid, password: "short" }, "Password must be at least 8 characters"],
    [{ email: valid.email, password: valid.password }, "Username is required"],
  ])("rejects invalid input %#", async (body, msg) => {
    const res = await request(server.httpServer).post("/api/auth/register").send(body);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ status: false, msg: expect.stringContaining(msg) });
  });

  it("rejects a duplicate username", async () => {
    await request(server.httpServer).post("/api/auth/register").send(valid);
    const res = await request(server.httpServer)
      .post("/api/auth/register")
      .send({ ...valid, email: "other@example.test" });
    expect(res.status).toBe(409);
    expect(res.body.msg).toBe("Username already used");
  });

  it("rejects a duplicate email", async () => {
    await request(server.httpServer).post("/api/auth/register").send(valid);
    const res = await request(server.httpServer)
      .post("/api/auth/register")
      .send({ ...valid, username: "alice2" });
    expect(res.status).toBe(409);
    expect(res.body.msg).toBe("Email already used");
  });

  it("returns a consistent error for malformed JSON", async () => {
    const res = await request(server.httpServer)
      .post("/api/auth/register")
      .set("Content-Type", "application/json")
      .send("{bad");
    expect(res.status).toBe(400);
    expect(res.body.status).toBe(false);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(server.httpServer).post("/api/auth/register").send(valid);
  });

  it("logs in with correct credentials", async () => {
    const res = await request(server.httpServer)
      .post("/api/auth/login")
      .send({ username: "alice", password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it("rejects a wrong password", async () => {
    const res = await request(server.httpServer)
      .post("/api/auth/login")
      .send({ username: "alice", password: "wrong-password" });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ status: false, msg: "Incorrect username or password" });
  });

  it("gives the same error for an unknown user", async () => {
    const res = await request(server.httpServer)
      .post("/api/auth/login")
      .send({ username: "nobody", password: "password123" });
    expect(res.status).toBe(401);
    expect(res.body.msg).toBe("Incorrect username or password");
  });

  it("requires both fields", async () => {
    const res = await request(server.httpServer).post("/api/auth/login").send({ username: "alice" });
    expect(res.status).toBe(400);
  });
});

describe("protected routes", () => {
  it("require a token", async () => {
    for (const path of ["/api/auth/allusers", "/api/auth/me", "/api/messages/123"]) {
      const res = await request(server.httpServer).get(path);
      expect(res.status).toBe(401);
      expect(res.body.status).toBe(false);
    }
    const post = await request(server.httpServer).post("/api/auth/setAvatar").send({ image: "abc" });
    expect(post.status).toBe(401);
  });

  it("reject a garbage token", async () => {
    const res = await request(server.httpServer).get("/api/auth/me").set("Authorization", "Bearer nope");
    expect(res.status).toBe(401);
  });

  it("reject a token signed with another secret", async () => {
    const user = await registerUser(server, "alice");
    const forged = jwt.sign({ sub: user.id }, "some-other-secret-value");
    const res = await request(server.httpServer).get("/api/auth/me").set("Authorization", `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  it("reject an expired token", async () => {
    const user = await registerUser(server, "alice");
    const expired = jwt.sign({ sub: user.id }, testConfig.jwtSecret, { expiresIn: -10 });
    const res = await request(server.httpServer).get("/api/auth/me").set("Authorization", `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });

  it("accept a valid token", async () => {
    const user = await registerUser(server, "alice");
    const res = await request(server.httpServer).get("/api/auth/me").set("Authorization", `Bearer ${user.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe("alice");
  });
});

describe("avatar and user list", () => {
  it("saves an avatar for the authenticated user only", async () => {
    const alice = await registerUser(server, "alice");
    const res = await request(server.httpServer)
      .post("/api/auth/setAvatar")
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ image: Buffer.from("<svg/>").toString("base64") });
    expect(res.status).toBe(200);
    expect(res.body.isSet).toBe(true);
    const me = await request(server.httpServer).get("/api/auth/me").set("Authorization", `Bearer ${alice.token}`);
    expect(me.body.user.isAvatarImageSet).toBe(true);
  });

  it("rejects an avatar that is not base64", async () => {
    const alice = await registerUser(server, "alice");
    const res = await request(server.httpServer)
      .post("/api/auth/setAvatar")
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ image: "<script>alert(1)</script>" });
    expect(res.status).toBe(400);
  });

  it("lists other users and excludes the caller", async () => {
    const alice = await registerUser(server, "alice");
    await registerUser(server, "bob");
    await registerUser(server, "carol");
    const res = await request(server.httpServer).get("/api/auth/allusers").set("Authorization", `Bearer ${alice.token}`);
    expect(res.status).toBe(200);
    expect(res.body.map((u: { username: string }) => u.username)).toEqual(["bob", "carol"]);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
  });
});

describe("misc", () => {
  it("serves health and a JSON 404", async () => {
    expect((await request(server.httpServer).get("/api/health")).body.status).toBe(true);
    const res = await request(server.httpServer).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.status).toBe(false);
  });

  it("sets security headers", async () => {
    const res = await request(server.httpServer).get("/api/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });
});

import request from "supertest";
import type { RunningServer } from "../src/server";
import { clearDb, registerUser, startTestServer, stopTestServer, type TestUser } from "./helpers";

let server: RunningServer;
let aditi: TestUser;
let shashank: TestUser;
let rohan: TestUser;

beforeAll(async () => {
  server = await startTestServer("messages-test");
});
afterAll(() => stopTestServer(server));
beforeEach(async () => {
  await clearDb();
  aditi = await registerUser(server, "aditi_kumari");
  shashank = await registerUser(server, "shashank_shekhar");
  rohan = await registerUser(server, "rohan_mehta");
});

const send = (from: TestUser, to: TestUser, message: string) =>
  request(server.httpServer).post("/api/messages/add").set("Authorization", `Bearer ${from.token}`).send({ to: to.id, message });
const fetchChat = (me: TestUser, other: TestUser) =>
  request(server.httpServer).get(`/api/messages/${other.id}`).set("Authorization", `Bearer ${me.token}`);

describe("sending", () => {
  it("stores a message with the sender taken from the token", async () => {
    const res = await send(aditi, shashank, "  hello shashank ");
    expect(res.status).toBe(201);
    expect(res.body.message).toMatchObject({ from: aditi.id, to: shashank.id, text: "hello shashank" });
  });

  it("rejects empty messages, unknown recipients and self messages", async () => {
    expect((await send(aditi, shashank, "   ")).status).toBe(400);
    expect((await send(aditi, aditi, "hi me")).status).toBe(400);
    const bad = await request(server.httpServer)
      .post("/api/messages/add")
      .set("Authorization", `Bearer ${aditi.token}`)
      .send({ to: "not-an-id", message: "x" });
    expect(bad.status).toBe(400);
    const missing = await request(server.httpServer)
      .post("/api/messages/add")
      .set("Authorization", `Bearer ${aditi.token}`)
      .send({ to: "64b7f0f0f0f0f0f0f0f0f0f0", message: "x" });
    expect(missing.status).toBe(404);
  });

  it("rejects a message over 2000 characters", async () => {
    const res = await send(aditi, shashank, "a".repeat(2001));
    expect(res.status).toBe(400);
  });

  it("ignores a spoofed sender field in the body", async () => {
    const res = await request(server.httpServer)
      .post("/api/messages/add")
      .set("Authorization", `Bearer ${aditi.token}`)
      .send({ to: shashank.id, message: "hi", from: rohan.id });
    expect(res.body.message.from).toBe(aditi.id);
  });
});

describe("fetching a conversation", () => {
  it("returns both directions in order for both participants", async () => {
    await send(aditi, shashank, "one");
    await send(shashank, aditi, "two");
    await send(aditi, shashank, "three");
    for (const [me, other] of [
      [aditi, shashank],
      [shashank, aditi],
    ] as const) {
      const res = await fetchChat(me, other);
      expect(res.status).toBe(200);
      expect(res.body.messages.map((m: { text: string }) => m.text)).toEqual(["one", "two", "three"]);
      expect(res.body.messages.map((m: { from: string }) => m.from)).toEqual([aditi.id, shashank.id, aditi.id]);
    }
  });

  it("does not let a third user read someone else's chat", async () => {
    await send(aditi, shashank, "secret");
    const res = await fetchChat(rohan, shashank);
    expect(res.status).toBe(200);
    expect(res.body.messages).toEqual([]);
    const other = await fetchChat(rohan, aditi);
    expect(other.body.messages).toEqual([]);
  });

  it("keeps conversations separate", async () => {
    await send(aditi, shashank, "to shashank");
    await send(aditi, rohan, "to rohan");
    const res = await fetchChat(aditi, rohan);
    expect(res.body.messages.map((m: { text: string }) => m.text)).toEqual(["to rohan"]);
  });

  it("rejects an invalid user id", async () => {
    const res = await request(server.httpServer).get("/api/messages/xyz").set("Authorization", `Bearer ${aditi.token}`);
    expect(res.status).toBe(400);
  });
});

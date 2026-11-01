import request from "supertest";
import type { RunningServer } from "../src/server";
import { clearDb, registerUser, startTestServer, stopTestServer, type TestUser } from "./helpers";

let server: RunningServer;
let alice: TestUser;
let bob: TestUser;
let carol: TestUser;

beforeAll(async () => {
  server = await startTestServer("messages-test");
});
afterAll(() => stopTestServer(server));
beforeEach(async () => {
  await clearDb();
  alice = await registerUser(server, "alice");
  bob = await registerUser(server, "bob");
  carol = await registerUser(server, "carol");
});

const send = (from: TestUser, to: TestUser, message: string) =>
  request(server.httpServer).post("/api/messages/add").set("Authorization", `Bearer ${from.token}`).send({ to: to.id, message });
const fetchChat = (me: TestUser, other: TestUser) =>
  request(server.httpServer).get(`/api/messages/${other.id}`).set("Authorization", `Bearer ${me.token}`);

describe("sending", () => {
  it("stores a message with the sender taken from the token", async () => {
    const res = await send(alice, bob, "  hello bob ");
    expect(res.status).toBe(201);
    expect(res.body.message).toMatchObject({ from: alice.id, to: bob.id, text: "hello bob" });
  });

  it("rejects empty messages, unknown recipients and self messages", async () => {
    expect((await send(alice, bob, "   ")).status).toBe(400);
    expect((await send(alice, alice, "hi me")).status).toBe(400);
    const bad = await request(server.httpServer)
      .post("/api/messages/add")
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ to: "not-an-id", message: "x" });
    expect(bad.status).toBe(400);
    const missing = await request(server.httpServer)
      .post("/api/messages/add")
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ to: "64b7f0f0f0f0f0f0f0f0f0f0", message: "x" });
    expect(missing.status).toBe(404);
  });

  it("rejects a message over 2000 characters", async () => {
    const res = await send(alice, bob, "a".repeat(2001));
    expect(res.status).toBe(400);
  });

  it("ignores a spoofed sender field in the body", async () => {
    const res = await request(server.httpServer)
      .post("/api/messages/add")
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ to: bob.id, message: "hi", from: carol.id });
    expect(res.body.message.from).toBe(alice.id);
  });
});

describe("fetching a conversation", () => {
  it("returns both directions in order for both participants", async () => {
    await send(alice, bob, "one");
    await send(bob, alice, "two");
    await send(alice, bob, "three");
    for (const [me, other] of [
      [alice, bob],
      [bob, alice],
    ] as const) {
      const res = await fetchChat(me, other);
      expect(res.status).toBe(200);
      expect(res.body.messages.map((m: { text: string }) => m.text)).toEqual(["one", "two", "three"]);
      expect(res.body.messages.map((m: { from: string }) => m.from)).toEqual([alice.id, bob.id, alice.id]);
    }
  });

  it("does not let a third user read someone else's chat", async () => {
    await send(alice, bob, "secret");
    const res = await fetchChat(carol, bob);
    expect(res.status).toBe(200);
    expect(res.body.messages).toEqual([]);
    const other = await fetchChat(carol, alice);
    expect(other.body.messages).toEqual([]);
  });

  it("keeps conversations separate", async () => {
    await send(alice, bob, "to bob");
    await send(alice, carol, "to carol");
    const res = await fetchChat(alice, carol);
    expect(res.body.messages.map((m: { text: string }) => m.text)).toEqual(["to carol"]);
  });

  it("rejects an invalid user id", async () => {
    const res = await request(server.httpServer).get("/api/messages/xyz").set("Authorization", `Bearer ${alice.token}`);
    expect(res.status).toBe(400);
  });
});

import request from "supertest";
import { io as connect, type Socket } from "socket.io-client";
import type { RunningServer } from "../src/server";
import { clearDb, registerUser, startTestServer, stopTestServer, type TestUser } from "./helpers";

let server: RunningServer;
let alice: TestUser;
let bob: TestUser;
let carol: TestUser;
const sockets: Socket[] = [];

function client(token: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const s = connect(`http://localhost:${server.port}`, { auth: { token }, transports: ["websocket"], forceNew: true });
    sockets.push(s);
    s.on("connect", () => resolve(s));
    s.on("connect_error", reject);
  });
}

const once = <T>(s: Socket, event: string): Promise<T> => new Promise((resolve) => s.once(event, resolve));

beforeAll(async () => {
  server = await startTestServer("socket-test");
});
afterAll(async () => {
  await stopTestServer(server);
});
beforeEach(async () => {
  await clearDb();
  alice = await registerUser(server, "alice");
  bob = await registerUser(server, "bob");
  carol = await registerUser(server, "carol");
});
afterEach(() => {
  while (sockets.length) sockets.pop()?.disconnect();
});

it("refuses a connection without a valid token", async () => {
  await expect(client("")).rejects.toThrow("Authentication required");
  await expect(client("garbage")).rejects.toThrow("Authentication required");
});

it("delivers a message sent over the socket to the recipient only", async () => {
  const a = await client(alice.token);
  const b = await client(bob.token);
  const c = await client(carol.token);
  const carolGot = jest.fn();
  c.on("msg-receive", carolGot);

  const received = once<{ from: string; text: string }>(b, "msg-receive");
  const ack = await new Promise<{ status: boolean }>((resolve) =>
    a.emit("msg-send", { to: bob.id, message: "hi bob" }, resolve)
  );
  expect(ack.status).toBe(true);
  expect(await received).toMatchObject({ from: alice.id, text: "hi bob" });
  await new Promise((r) => setTimeout(r, 100));
  expect(carolGot).not.toHaveBeenCalled();

  const history = await request(server.httpServer)
    .get(`/api/messages/${alice.id}`)
    .set("Authorization", `Bearer ${bob.token}`);
  expect(history.body.messages).toHaveLength(1);
});

it("delivers messages sent through the REST endpoint live as well", async () => {
  const b = await client(bob.token);
  const received = once<{ text: string }>(b, "msg-receive");
  await request(server.httpServer)
    .post("/api/messages/add")
    .set("Authorization", `Bearer ${alice.token}`)
    .send({ to: bob.id, message: "via rest" });
  expect((await received).text).toBe("via rest");
});

it("works in both directions between two clients", async () => {
  const a = await client(alice.token);
  const b = await client(bob.token);
  const toBob = once<{ text: string }>(b, "msg-receive");
  a.emit("msg-send", { to: bob.id, message: "ping" });
  expect((await toBob).text).toBe("ping");
  const toAlice = once<{ text: string }>(a, "msg-receive");
  b.emit("msg-send", { to: alice.id, message: "pong" });
  expect((await toAlice).text).toBe("pong");
});

it("uses the authenticated user as sender and reports errors in the ack", async () => {
  const a = await client(alice.token);
  const bad = await new Promise<{ status: boolean; msg?: string }>((resolve) =>
    a.emit("msg-send", { to: "nope", message: "x" }, resolve)
  );
  expect(bad).toEqual({ status: false, msg: "Invalid recipient id" });
  const malformed = await new Promise<{ status: boolean }>((resolve) => a.emit("msg-send", { foo: 1 }, resolve));
  expect(malformed.status).toBe(false);
});

it("tracks online users", async () => {
  const a = await client(alice.token);
  const b = await client(bob.token);
  await new Promise((r) => setTimeout(r, 100));
  expect(server.hub.onlineUserIds().sort()).toEqual([alice.id, bob.id].sort());
  const update = once<string[]>(a, "online-users");
  b.disconnect();
  expect(await update).toEqual([alice.id]);
});

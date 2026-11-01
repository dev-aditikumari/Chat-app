import request from "supertest";
import { io as connect, type Socket } from "socket.io-client";
import type { RunningServer } from "../src/server";
import { clearDb, registerUser, startTestServer, stopTestServer, type TestUser } from "./helpers";

let server: RunningServer;
let aditi: TestUser;
let shashank: TestUser;
let rohan: TestUser;
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
  aditi = await registerUser(server, "aditi_kumari");
  shashank = await registerUser(server, "shashank_shekhar");
  rohan = await registerUser(server, "rohan_mehta");
});
afterEach(() => {
  while (sockets.length) sockets.pop()?.disconnect();
});

it("refuses a connection without a valid token", async () => {
  await expect(client("")).rejects.toThrow("Authentication required");
  await expect(client("garbage")).rejects.toThrow("Authentication required");
});

it("delivers a message sent over the socket to the recipient only", async () => {
  const a = await client(aditi.token);
  const b = await client(shashank.token);
  const c = await client(rohan.token);
  const rohanGot = jest.fn();
  c.on("msg-receive", rohanGot);

  const received = once<{ from: string; text: string }>(b, "msg-receive");
  const ack = await new Promise<{ status: boolean }>((resolve) =>
    a.emit("msg-send", { to: shashank.id, message: "hi shashank" }, resolve)
  );
  expect(ack.status).toBe(true);
  expect(await received).toMatchObject({ from: aditi.id, text: "hi shashank" });
  await new Promise((r) => setTimeout(r, 100));
  expect(rohanGot).not.toHaveBeenCalled();

  const history = await request(server.httpServer)
    .get(`/api/messages/${aditi.id}`)
    .set("Authorization", `Bearer ${shashank.token}`);
  expect(history.body.messages).toHaveLength(1);
});

it("delivers messages sent through the REST endpoint live as well", async () => {
  const b = await client(shashank.token);
  const received = once<{ text: string }>(b, "msg-receive");
  await request(server.httpServer)
    .post("/api/messages/add")
    .set("Authorization", `Bearer ${aditi.token}`)
    .send({ to: shashank.id, message: "via rest" });
  expect((await received).text).toBe("via rest");
});

it("works in both directions between two clients", async () => {
  const a = await client(aditi.token);
  const b = await client(shashank.token);
  const toShashank = once<{ text: string }>(b, "msg-receive");
  a.emit("msg-send", { to: shashank.id, message: "ping" });
  expect((await toShashank).text).toBe("ping");
  const toAditi = once<{ text: string }>(a, "msg-receive");
  b.emit("msg-send", { to: aditi.id, message: "pong" });
  expect((await toAditi).text).toBe("pong");
});

it("uses the authenticated user as sender and reports errors in the ack", async () => {
  const a = await client(aditi.token);
  const bad = await new Promise<{ status: boolean; msg?: string }>((resolve) =>
    a.emit("msg-send", { to: "nope", message: "x" }, resolve)
  );
  expect(bad).toEqual({ status: false, msg: "Invalid recipient id" });
  const malformed = await new Promise<{ status: boolean }>((resolve) => a.emit("msg-send", { foo: 1 }, resolve));
  expect(malformed.status).toBe(false);
});

it("tracks online users", async () => {
  const a = await client(aditi.token);
  const b = await client(shashank.token);
  await new Promise((r) => setTimeout(r, 100));
  expect(server.hub.onlineUserIds().sort()).toEqual([aditi.id, shashank.id].sort());
  const update = once<string[]>(a, "online-users");
  b.disconnect();
  expect(await update).toEqual([aditi.id]);
});

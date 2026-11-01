import request from "supertest";
import type { RunningServer } from "../src/server";
import { startTestServer, stopTestServer, testConfig } from "./helpers";

let server: RunningServer;
beforeAll(async () => {
  server = await startTestServer("ratelimit-test", { ...testConfig, authRateLimit: 3 });
});
afterAll(() => stopTestServer(server));

it("limits repeated auth attempts", async () => {
  const statuses: number[] = [];
  for (let i = 0; i < 5; i++) {
    const res = await request(server.httpServer).post("/api/auth/login").send({ username: "x", password: "y" });
    statuses.push(res.status);
  }
  expect(statuses.slice(0, 3)).toEqual([401, 401, 401]);
  expect(statuses.slice(3)).toEqual([429, 429]);
});

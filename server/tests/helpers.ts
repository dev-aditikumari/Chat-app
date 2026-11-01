import mongoose from "mongoose";
import request from "supertest";
import type { Config } from "../src/config";
import { startServer, type RunningServer } from "../src/server";

export const testConfig: Config = {
  port: 0,
  mongoUri: "",
  jwtSecret: "test-secret-0123456789abcdef",
  jwtExpiresIn: "1h",
  clientOrigins: ["http://localhost:5210"],
  authRateLimit: 1000,
};

export async function startTestServer(dbName: string, config: Config = testConfig): Promise<RunningServer> {
  await mongoose.connect(`${process.env.TEST_MONGO_URI}${dbName}`);
  return startServer(config, 0);
}

export async function stopTestServer(server: RunningServer): Promise<void> {
  await server.close();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}

export async function clearDb(): Promise<void> {
  await mongoose.connection.db?.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
}

export interface TestUser {
  id: string;
  username: string;
  token: string;
}

export async function registerUser(server: RunningServer, username: string): Promise<TestUser> {
  const res = await request(server.httpServer)
    .post("/api/auth/register")
    .send({ username, email: `${username}@example.test`, password: "password123" });
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { id: res.body.user._id, username, token: res.body.token };
}

import { MongoMemoryServer } from "mongodb-memory-server";

export default async function globalSetup(): Promise<void> {
  const mongod = await MongoMemoryServer.create();
  process.env.TEST_MONGO_URI = mongod.getUri();
  (globalThis as { __MONGOD__?: MongoMemoryServer }).__MONGOD__ = mongod;
}

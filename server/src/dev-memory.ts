import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { loadConfig } from "./config";
import { User } from "./models/User";
import { initialsAvatar } from "./avatar";
import { startServer } from "./server";

async function seed(): Promise<void> {
  const passwordHash = await bcrypt.hash("demo-password-1", 10);
  for (const name of ["alice", "bob"]) {
    await User.create({
      username: name,
      email: `${name}@example.test`,
      passwordHash,
      isAvatarImageSet: true,
      avatarImage: initialsAvatar(name),
    });
  }
}

async function main(): Promise<void> {
  process.env.JWT_SECRET ??= "dev-only-memory-secret-0123456789";
  const config = loadConfig();
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri("chat-app"));
  await seed();
  const server = await startServer(config);
  console.log(`Chat server (in-memory MongoDB) on port ${server.port}`);
  console.log("Demo users: alice / bob, password: demo-password-1");

  const shutdown = async (): Promise<void> => {
    await server.close();
    await mongoose.disconnect();
    await mongod.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { loadConfig } from "./config";
import { Message } from "./models/Message";
import { User } from "./models/User";
import { initialsAvatar } from "./avatar";
import { startServer } from "./server";

const DEMO_USERS = [
  "aditi_kumari",
  "shashank_shekhar",
  "rohan_mehta",
  "priya_sharma",
  "ananya_iyer",
  "vikram_singh",
];

const DEMO_CONVERSATION: Array<[from: string, text: string]> = [
  ["aditi_kumari", "Hey Shashank, kal ki demo ke liye slides ready hain?"],
  ["shashank_shekhar", "Haan, almost ready. Bas last slide pe architecture diagram add karna hai."],
  ["aditi_kumari", "Perfect. Socket wala part bhi dikhana, jahan messages live aate hain."],
  ["shashank_shekhar", "Done. Do browsers kholunga, ek se bhejunga aur doosre mein turant aa jayega."],
  ["aditi_kumari", "Sounds good. Kal 11 baje call pe milte hain?"],
  ["shashank_shekhar", "Theek hai, 11 baje pakka."],
];

async function seed(): Promise<void> {
  const passwordHash = await bcrypt.hash("demo-password-1", 10);
  const ids = new Map<string, string>();
  for (const name of DEMO_USERS) {
    const user = await User.create({
      username: name,
      email: `${name}@example.test`,
      passwordHash,
      isAvatarImageSet: true,
      avatarImage: initialsAvatar(name),
    });
    ids.set(name, user._id.toString());
  }
  const start = Date.now() - DEMO_CONVERSATION.length * 3 * 60 * 1000;
  for (const [i, [from, text]] of DEMO_CONVERSATION.entries()) {
    const to = from === "aditi_kumari" ? "shashank_shekhar" : "aditi_kumari";
    await Message.create({ from: ids.get(from), to: ids.get(to), text, createdAt: new Date(start + i * 3 * 60 * 1000) });
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
  console.log(`Demo users: ${DEMO_USERS.join(", ")} (password: demo-password-1)`);

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

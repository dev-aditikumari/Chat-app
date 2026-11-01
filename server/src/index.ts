import mongoose from "mongoose";
import { loadConfig } from "./config";
import { startServer } from "./server";

async function main(): Promise<void> {
  const config = loadConfig();
  await mongoose.connect(config.mongoUri);
  const server = await startServer(config);
  console.log(`Chat server listening on port ${server.port}`);

  const shutdown = async (): Promise<void> => {
    await server.close();
    await mongoose.disconnect();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

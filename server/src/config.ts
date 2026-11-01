import "dotenv/config";

export interface Config {
  port: number;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  clientOrigins: string[];
  authRateLimit: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const jwtSecret = env.JWT_SECRET ?? "";
  if (jwtSecret.length < 16) {
    throw new Error("JWT_SECRET must be set and at least 16 characters long");
  }
  return {
    port: Number(env.PORT ?? 5200),
    mongoUri: env.MONGO_URI ?? "mongodb://localhost:27017/chat-app",
    jwtSecret,
    jwtExpiresIn: env.JWT_EXPIRES_IN ?? "7d",
    clientOrigins: (env.CLIENT_ORIGIN ?? "http://localhost:5210")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    authRateLimit: Number(env.AUTH_RATE_LIMIT ?? 30),
  };
}

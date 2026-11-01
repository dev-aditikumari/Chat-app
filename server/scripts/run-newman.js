// Starts the in-memory dev server, runs the Postman collection against it, then stops the server.
const { spawn } = require("child_process");
const path = require("path");
const newman = require("newman");

const port = process.env.PORT || "5200";
const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
const root = path.resolve(__dirname, "..", "..");

async function waitForHealth(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`${url}/api/health`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Server did not become healthy in time");
}

async function main() {
  let child;
  if (!process.env.BASE_URL) {
    child = spawn(process.execPath, [require.resolve("tsx/cli"), "src/dev-memory.ts"], {
      cwd: path.resolve(__dirname, ".."),
      env: { ...process.env, PORT: port, AUTH_RATE_LIMIT: "1000" },
      stdio: "inherit",
    });
  }
  const stop = () => child && child.kill("SIGTERM");
  try {
    await waitForHealth(baseUrl);
    const code = await new Promise((resolve) => {
      newman.run(
        {
          collection: path.join(root, "postman", "chat-app.postman_collection.json"),
          environment: path.join(root, "postman", "chat-app.postman_environment.json"),
          envVar: [{ key: "baseUrl", value: baseUrl }],
          reporters: "cli",
        },
        (err, summary) => resolve(err || summary.run.failures.length ? 1 : 0)
      );
    });
    stop();
    process.exit(code);
  } catch (err) {
    console.error(err);
    stop();
    process.exit(1);
  }
}

main();

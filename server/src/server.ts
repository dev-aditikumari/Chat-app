import http from "http";
import type { AddressInfo } from "net";
import { createApp } from "./app";
import type { Config } from "./config";
import { ChatHub } from "./socket/hub";

export interface RunningServer {
  httpServer: http.Server;
  hub: ChatHub;
  port: number;
  close: () => Promise<void>;
}

export async function startServer(config: Config, port = config.port): Promise<RunningServer> {
  let hub: ChatHub | undefined;
  const app = createApp(config, () => hub);
  const httpServer = http.createServer(app);
  hub = new ChatHub(httpServer, config);
  await new Promise<void>((resolve) => httpServer.listen(port, resolve));
  const actualPort = (httpServer.address() as AddressInfo).port;
  return {
    httpServer,
    hub,
    port: actualPort,
    close: async () => {
      await hub?.close();
      if (httpServer.listening) await new Promise<void>((r) => httpServer.close(() => r()));
    },
  };
}

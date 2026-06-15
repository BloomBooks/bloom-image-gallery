import react from "@vitejs/plugin-react";
import { defineConfig, type PluginOption } from "vite";
import { spawn, type ChildProcess } from "child_process";
import { createConnection } from "net";
import { port } from "./common/locations";

// Returns true if something is already listening on the given local port.
function isPortInUse(p: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ port: p, host: "127.0.0.1" });
    const done = (inUse: boolean) => {
      socket.destroy();
      resolve(inUse);
    };
    socket.setTimeout(500);
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
    socket.once("timeout", () => done(false));
  });
}

// Starts the local API server (the Express app serving /local-collections, which
// makes Art of Reading and other local collections available) whenever the Vite
// dev server runs, so `vp dev` alone brings up both the client and the server.
function localApiServer(): PluginOption {
  let child: ChildProcess | undefined;
  const stop = () => {
    const pid = child?.pid;
    child = undefined;
    if (!pid) return;
    // Kill the whole tree: `pnpm run server` spawns concurrently -> tsc + nodemon -> node.
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(pid), "/T", "/F"]);
    } else {
      try {
        process.kill(pid);
      } catch {
        // already gone
      }
    }
  };
  return {
    name: "local-api-server",
    apply: "serve",
    async configureServer() {
      if (child) return;
      // If the API is already up (e.g. started manually with `pnpm run server`),
      // don't start a duplicate and collide on the port.
      if (await isPortInUse(port)) return;
      child = spawn("pnpm", ["run", "server"], { stdio: "inherit", shell: true });
      process.once("exit", stop);
      process.once("SIGINT", () => {
        stop();
        process.exit();
      });
      process.once("SIGTERM", () => {
        stop();
        process.exit();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  // Route JSX through Emotion's runtime so the `css` prop works everywhere
  // without per-file pragmas.
  plugins: [react({ jsxImportSource: "@emotion/react" }), localApiServer()],
  server: {
    open: true,
  },
  build: {
    target: "esnext",
    // silence the bazillion warnings related to "use client" of react and the materialui 5 library
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
          return;
        }
        warn(warning);
      },
    },
  },
});

import { defineConfig } from "vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";
import fs from "node:fs";

export default defineConfig(({ command }) => {
  const hasCerts =
    fs.existsSync("./certs/localhost-key.pem") &&
    fs.existsSync("./certs/localhost.pem");

  return {
    plugins: [
      tsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      tailwindcss(),
      tanstackStart({
        server: {
          entry: "server",
        },
      }),
      viteReact(),
      command === "build"
        ? nitro({
          preset: process.env.NITRO_PRESET || "cloudflare_module",
          })
        : undefined,
    ].filter(Boolean),

    server: {
      host: "0.0.0.0",
      port: 5173,
      ...(hasCerts
        ? {
            https: {
              key: fs.readFileSync("./certs/localhost-key.pem"),
              cert: fs.readFileSync("./certs/localhost.pem"),
            },
          }
        : {}),
      proxy: {
        "/api": {
          target: "http://127.0.0.1:4000",
          changeOrigin: true,
          secure: false,
        },
        "/uploads": {
          target: "http://localhost:5003",
          changeOrigin: true,
          secure: false,
        },
        "/socket.io/calls": {
          target: "http://localhost:5006",
          changeOrigin: true,
          secure: false,
          ws: true,
        },
        "/socket.io/messages": {
          target: "http://localhost:5003",
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
  };
});

import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { uploadOfficialBook } from "../bookUpload";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { ensurePushVapidKeys } from "../pushNotifications";

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.post("/api/studio/upload-book", express.raw({ type: "application/pdf", limit: "25mb" }), uploadOfficialBook);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  const assetLinksPath = process.env.NODE_ENV === "development"
    ? path.resolve(import.meta.dirname, "../..", "client", "public", ".well-known", "assetlinks.json")
    : path.resolve(import.meta.dirname, "public", ".well-known", "assetlinks.json");
  app.get("/.well-known/assetlinks.json", (_req, res, next) => {
    res.type("application/json").sendFile(assetLinksPath, error => {
      if (error) next(error);
    });
  });
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "3000");

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    void ensurePushVapidKeys().then(() => console.log("[Push] VAPID keys ready")).catch((error: unknown) => console.warn("[Push] VAPID initialization deferred:", error));
  });
}

startServer().catch(console.error);

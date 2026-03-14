import { Router } from "express";

import type { RouteModule } from "../types/route-module";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "watering-api",
    timestamp: new Date().toISOString(),
  });
});

export const healthRoute: RouteModule = {
  path: "/health",
  router,
};

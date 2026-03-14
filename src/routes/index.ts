import { Router } from "express";

import type { RouteModule } from "../types/route-module";
import { dashboardRoute } from "./dashboard/dashboard.route";
import { healthRoute } from "./health.route";
import { wateringRoute } from "./watering.route";

const routeModules: RouteModule[] = [
  healthRoute,
  wateringRoute,
  dashboardRoute,
];

export const apiRouter = Router();

routeModules.forEach(({ path, router }) => {
  apiRouter.use(path, router);
});

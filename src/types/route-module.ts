import type { Router } from "express";

export interface RouteModule {
  path: string;
  router: Router;
}

import { Router } from "express";
import type { RowDataPacket } from "mysql2";

import { dbPool } from "../config/db";
import { env } from "../config/env";
import type { RouteModule } from "../types/route-module";

interface PlantRow extends RowDataPacket {
  id: number;
  watering_duration: number;
  enabled: number;
  watering_frequency: number;
}

interface WateringOrderRow extends RowDataPacket {
  id: number;
  duration: number;
}

interface WateringLogCountRow extends RowDataPacket {
  count: number;
}

interface PlantIdRow extends RowDataPacket {
  id: number;
}

interface WateringOrderIdRow extends RowDataPacket {
  id: number;
}

const router = Router();

const parsePlantId = (value: unknown): number | null => {
  const plantId = Number(value);

  if (!Number.isInteger(plantId) || plantId <= 0) {
    return null;
  }

  return plantId;
};

const isValidToken = (token: unknown): boolean => {
  return typeof token === "string" && token === env.deviceToken;
};

const isWithinFranceQuietHours = (date: Date = new Date()): boolean => {
  const hourInFrance = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Paris",
      hour: "2-digit",
      hour12: false,
    }).format(date),
  );

  return hourInFrance >= 22 || hourInFrance < 9;
};

const logRouteCall = async (
  plantId: number,
  routePath: string,
): Promise<void> => {
  await dbPool.execute(
    "INSERT INTO calls (plant_id, date, route_path) VALUES (?, NOW(), ?)",
    [plantId, routePath],
  );
};

router.get("/esp/is_watering_needed", async (req, res, next) => {
  try {
    if (!isValidToken(req.query.token)) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const plantId = parsePlantId(req.query.plant_id);

    if (plantId === null) {
      return res.status(400).json({ error: "Invalid or missing plant_id" });
    }

    await logRouteCall(plantId, "/esp/is_watering_needed");

    const [plantRows] = await dbPool.query<PlantRow[]>(
      "SELECT id, watering_duration, enabled, watering_frequency FROM plants WHERE id = ? LIMIT 1",
      [plantId],
    );

    const plant = plantRows[0];

    if (!plant) {
      return res.status(404).json({ error: "Plant not found" });
    }

    if (!plant.enabled) {
      return res.status(200).json({
        watering_needed: false,
        duration: plant.watering_duration,
      });
    }

    if (isWithinFranceQuietHours()) {
      return res.status(200).json({
        watering_needed: false,
        duration: plant.watering_duration,
      });
    }

    const [orderRows] = await dbPool.query<WateringOrderRow[]>(
      "SELECT id, duration FROM watering_orders WHERE plant_id = ? ORDER BY date DESC LIMIT 1",
      [plantId],
    );

    const latestOrder = orderRows[0];

    if (!latestOrder) {
      return res.status(200).json({
        watering_needed: false,
        duration: plant.watering_duration,
      });
    }

    const [logCountRows] = await dbPool.query<WateringLogCountRow[]>(
      "SELECT COUNT(*) AS count FROM watering_logs WHERE order_id = ?",
      [latestOrder.id],
    );

    const logCount = logCountRows[0]?.count ?? 0;
    const wateringNeeded = logCount === 0;

    return res.status(200).json({
      watering_needed: wateringNeeded,
      duration: latestOrder.duration,
      order_id: latestOrder.id,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/esp/water_plant", async (req, res, next) => {
  try {
    if (!isValidToken(req.body?.token)) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const plantId = parsePlantId(req.body?.plant_id);
    const status = req.body?.status;

    if (plantId === null) {
      return res.status(400).json({ error: "Invalid or missing plant_id" });
    }

    await logRouteCall(plantId, "/esp/water_plant");

    if (status !== "started" && status !== "completed") {
      return res
        .status(400)
        .json({ error: "Invalid status. Use 'started' or 'completed'." });
    }

    const [plantRows] = await dbPool.query<PlantIdRow[]>(
      "SELECT id FROM plants WHERE id = ? LIMIT 1",
      [plantId],
    );

    if (!plantRows[0]) {
      return res.status(404).json({ error: "Plant not found" });
    }

    const [latestOrderRows] = await dbPool.query<WateringOrderIdRow[]>(
      "SELECT id FROM watering_orders WHERE plant_id = ? ORDER BY date DESC LIMIT 1",
      [plantId],
    );

    const orderId = latestOrderRows[0]?.id ?? null;

    await dbPool.execute(
      "INSERT INTO watering_logs (plant_id, date, status, order_id) VALUES (?, NOW(), ?, ?)",
      [plantId, status, orderId],
    );

    return res.status(201).json({
      message: "Watering log recorded",
      plant_id: plantId,
      status,
      order_id: orderId,
    });
  } catch (error) {
    return next(error);
  }
});

export const wateringRoute: RouteModule = {
  path: "/",
  router,
};

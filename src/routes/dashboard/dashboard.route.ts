import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { dbPool } from "../../config/db";
import { env } from "../../config/env";
import type { RouteModule } from "../../types/route-module";

interface PlantRow extends RowDataPacket {
  id: number;
  watering_duration: number;
  enabled: number;
  watering_frequency: number;
}

interface PlantIdRow extends RowDataPacket {
  id: number;
}

const router = Router();

const parsePositiveInteger = (value: unknown): number | null => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const parseBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === 1 || value === "1" || value === "true") {
    return true;
  }

  if (value === 0 || value === "0" || value === "false") {
    return false;
  }

  return null;
};

const isValidToken = (token: unknown): boolean => {
  return typeof token === "string" && token === env.deviceToken;
};

router.get("/list_plants", async (_req, res, next) => {
  try {
    if (!isValidToken(_req.query.token)) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const [rows] = await dbPool.query<PlantRow[]>(
      "SELECT id, watering_duration, enabled, watering_frequency FROM plants ORDER BY id ASC",
    );

    return res.status(200).json({
      plants: rows.map((plant) => ({
        id: plant.id,
        watering_duration: plant.watering_duration,
        enabled: Boolean(plant.enabled),
        watering_frequency: plant.watering_frequency,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/create_plant", async (req, res, next) => {
  try {
    if (!isValidToken(req.body?.token)) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const wateringDuration = parsePositiveInteger(req.body?.watering_duration);
    const wateringFrequency = parsePositiveInteger(
      req.body?.watering_frequency,
    );
    const enabled =
      req.body?.enabled === undefined ? true : parseBoolean(req.body.enabled);

    if (
      wateringDuration === null ||
      wateringFrequency === null ||
      enabled === null
    ) {
      return res.status(400).json({
        error:
          "Invalid body. Required: watering_duration, watering_frequency. Optional: enabled.",
      });
    }

    const [result] = await dbPool.execute<ResultSetHeader>(
      "INSERT INTO plants (watering_duration, enabled, watering_frequency) VALUES (?, ?, ?)",
      [wateringDuration, enabled ? 1 : 0, wateringFrequency],
    );

    return res.status(201).json({
      message: "Plant created",
      plant: {
        id: result.insertId,
        watering_duration: wateringDuration,
        enabled,
        watering_frequency: wateringFrequency,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/update_plant", async (req, res, next) => {
  try {
    if (!isValidToken(req.body?.token)) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const plantId = parsePositiveInteger(req.body?.plant_id);

    if (plantId === null) {
      return res.status(400).json({ error: "Invalid or missing plant_id" });
    }

    const wateringDuration =
      req.body?.watering_duration === undefined
        ? undefined
        : parsePositiveInteger(req.body.watering_duration);
    const wateringFrequency =
      req.body?.watering_frequency === undefined
        ? undefined
        : parsePositiveInteger(req.body.watering_frequency);
    const enabled =
      req.body?.enabled === undefined
        ? undefined
        : parseBoolean(req.body.enabled);

    if (
      wateringDuration === null ||
      wateringFrequency === null ||
      enabled === null
    ) {
      return res.status(400).json({
        error:
          "Invalid body. Optional fields: watering_duration, watering_frequency, enabled.",
      });
    }

    const hasUpdate =
      wateringDuration !== undefined ||
      wateringFrequency !== undefined ||
      enabled !== undefined;

    if (!hasUpdate) {
      return res.status(400).json({
        error:
          "Nothing to update. Provide at least one field: watering_duration, watering_frequency, enabled.",
      });
    }

    const [plantRows] = await dbPool.query<PlantIdRow[]>(
      "SELECT id FROM plants WHERE id = ? LIMIT 1",
      [plantId],
    );

    if (!plantRows[0]) {
      return res.status(404).json({ error: "Plant not found" });
    }

    const setClauses: string[] = [];
    const values: number[] = [];

    if (wateringDuration !== undefined) {
      setClauses.push("watering_duration = ?");
      values.push(wateringDuration);
    }

    if (wateringFrequency !== undefined) {
      setClauses.push("watering_frequency = ?");
      values.push(wateringFrequency);
    }

    if (enabled !== undefined) {
      setClauses.push("enabled = ?");
      values.push(enabled ? 1 : 0);
    }

    values.push(plantId);

    await dbPool.execute(
      `UPDATE plants SET ${setClauses.join(", ")} WHERE id = ?`,
      values,
    );

    const [updatedPlantRows] = await dbPool.query<PlantRow[]>(
      "SELECT id, watering_duration, enabled, watering_frequency FROM plants WHERE id = ? LIMIT 1",
      [plantId],
    );

    const updatedPlant = updatedPlantRows[0];

    if (!updatedPlant) {
      return res.status(404).json({ error: "Plant not found" });
    }

    return res.status(200).json({
      message: "Plant updated",
      plant: {
        id: updatedPlant.id,
        watering_duration: updatedPlant.watering_duration,
        enabled: Boolean(updatedPlant.enabled),
        watering_frequency: updatedPlant.watering_frequency,
      },
    });
  } catch (error) {
    return next(error);
  }
});

export const dashboardRoute: RouteModule = {
  path: "/dashboard",
  router,
};

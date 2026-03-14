import type { RowDataPacket } from "mysql2";

import { dbPool } from "../config/db";

interface PlantRow extends RowDataPacket {
  id: number;
  watering_duration: number;
  watering_frequency: number;
}

interface WateringOrderRow extends RowDataPacket {
  date: Date;
}

const checkAndCreateWateringOrders = async (): Promise<void> => {
  const [plants] = await dbPool.query<PlantRow[]>(
    "SELECT id, watering_duration, watering_frequency FROM plants WHERE enabled = 1",
  );

  for (const plant of plants) {
    const [orderRows] = await dbPool.query<WateringOrderRow[]>(
      "SELECT date FROM watering_orders WHERE plant_id = ? ORDER BY date DESC LIMIT 1",
      [plant.id],
    );

    const latestOrder = orderRows[0];

    const shouldCreateOrder =
      !latestOrder ||
      (Date.now() - new Date(latestOrder.date).getTime()) / 1000 >=
        plant.watering_frequency;

    if (shouldCreateOrder) {
      await dbPool.execute(
        "INSERT INTO watering_orders (plant_id, date, duration) VALUES (?, NOW(), ?)",
        [plant.id, plant.watering_duration],
      );
    }
  }
};

export const startWateringOrdersCron = (): void => {
  checkAndCreateWateringOrders().catch((err: unknown) => {
    console.error("[cron] Failed to create watering orders:", err);
  });

  setInterval(() => {
    checkAndCreateWateringOrders().catch((err: unknown) => {
      console.error("[cron] Failed to create watering orders:", err);
    });
  }, 60_000);
};

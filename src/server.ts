import app from "./app";
import { env } from "./config/env";
import { startWateringOrdersCron } from "./cron/watering-orders.cron";

app.listen(env.port, () => {
  console.log(`watering-api listening on port ${env.port}`);
  startWateringOrdersCron();
});

CREATE TABLE IF NOT EXISTS watering_orders (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  plant_id INT UNSIGNED NOT NULL,
  date DATETIME NOT NULL,
  duration INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_watering_orders_plant_id
    FOREIGN KEY (plant_id)
    REFERENCES plants(id)
    ON DELETE CASCADE
);

ALTER TABLE watering_logs
  ADD COLUMN order_id INT UNSIGNED NULL,
  ADD CONSTRAINT fk_watering_logs_order_id
    FOREIGN KEY (order_id)
    REFERENCES watering_orders(id)
    ON DELETE SET NULL;

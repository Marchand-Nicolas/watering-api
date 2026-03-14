import "dotenv/config";

const DEFAULT_PORT = 3000;

const portFromEnv = Number(process.env.PORT ?? DEFAULT_PORT);

if (Number.isNaN(portFromEnv)) {
  throw new Error("Invalid PORT environment variable");
}

const deviceToken = process.env.DEVICE_TOKEN;

if (!deviceToken) {
  throw new Error("Missing DEVICE_TOKEN environment variable");
}

const dbPortFromEnv = Number(process.env.DB_PORT ?? 3306);

if (Number.isNaN(dbPortFromEnv)) {
  throw new Error("Invalid DB_PORT environment variable");
}

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

if (!dbHost || !dbUser || !dbName) {
  throw new Error(
    "Missing required DB environment variables (DB_HOST, DB_USER, DB_NAME)",
  );
}

export const env = {
  port: portFromEnv,
  deviceToken,
  db: {
    host: dbHost,
    port: dbPortFromEnv,
    user: dbUser,
    password: dbPassword,
    database: dbName,
  },
};

import express from "express";

import { errorHandler } from "./middlewares/error-handler";
import { notFoundHandler } from "./middlewares/not-found";
import { apiRouter } from "./routes";

const app = express();

app.use((req, res, next) => {
  const isLocalhostRequest =
    req.hostname === "localhost" || req.hostname === "127.0.0.1";

  if (isLocalhostRequest) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
  }

  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

app.use("/api", apiRouter);
app.use("/", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

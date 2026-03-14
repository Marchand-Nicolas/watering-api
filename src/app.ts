import express from "express";

import { errorHandler } from "./middlewares/error-handler";
import { notFoundHandler } from "./middlewares/not-found";
import { apiRouter } from "./routes";

const app = express();

app.use(express.json());

app.use("/api", apiRouter);
app.use("/", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

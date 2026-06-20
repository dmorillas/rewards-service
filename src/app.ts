import "reflect-metadata";
import "./container";
import express, { Request, Response } from "express";
import rewardsRoutes from "./routes/rewards";
import { errorHandler } from "./middlewares/error.handler";

const app = express();
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use(rewardsRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

app.use(errorHandler);

export default app;

/* v8 ignore start */
if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT ?? 8080);
  app.listen(port, () => {
    console.log(`Rewards service running on port ${port}`);
  });
}
/* v8 ignore stop */

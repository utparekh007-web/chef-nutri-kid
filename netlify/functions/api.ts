import serverless from "serverless-http";
import express from "express";
import { apiRouter } from "../../src/api.js";

const app = express();
app.use(express.json({ limit: '50mb' }));

// Mount at root - Netlify redirect sends /api/recipe as /recipe to this function
app.use("/", apiRouter);
app.use("/api", apiRouter);

export const handler = serverless(app);

// src/app.ts
import express from "express";
import authRouter from "./routers/authRouter";
import cors from "cors";
import cookieParser from "cookie-parser";
import transactionRouter from "./routers/transactionRouter";

const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "",
    methods: ["GET", "POST", "OPTIONS", "DELETE", "PUT"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Server healthy");
});

app.use("/auth", authRouter);
app.use("/transaction", transactionRouter);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

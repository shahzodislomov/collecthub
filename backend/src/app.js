import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import itemRoutes from "./routes/items.js";

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(
    cors({
        origin: env.CORS_ORIGIN,
        credentials: true,
    })
);
if (env.NODE_ENV !== "test") {
    app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
}
app.use(express.json({ limit: "100kb" }));
app.use(
    express.urlencoded({
        extended: true,
        limit: "100kb",
    })
);
app.use(cookieParser());

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests. Please try again later.",
        },
    },
});

app.use("/api", apiLimiter);
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString(),
    });
});
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);

app.use((req, res, next) => {
    const error = new Error(
        `Route not found: ${req.method} ${req.originalUrl}`
    );

    error.statusCode = 404;
    error.code = "ROUTE_NOT_FOUND";

    next(error);
});

app.use(errorHandler);
export default app;

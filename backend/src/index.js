import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase, prisma } from "./config/prisma.js"
let isShuttingDown = false
let server;

async function startServer() {
    try {
        await connectDatabase()
        server = app.listen(env.PORT, () => {
            console.log(`Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`)
        })
    } catch (error) {
        console.error("Failed to start server: ", error)
        await disconnectDatabase().catch(() => { })
        process.exit(1)
    }
}

async function shutdown(signal, error = null) {
    if (isShuttingDown) return;
    isShuttingDown = true
    if (error) {
        console.error(`${signal}:`, error);
    } else {
        console.log(`${signal} received. Shutting down...`);
    }
    console.log(`${signal} received. shutting down gracefully...`)
    const forceShutDownTimeout = setTimeout(() => {
        console.error("Graceful shutdown timed out. Forcing exit.")
        process.exit(1)
    }, 10_000)
    forceShutDownTimeout.unref();
    try {
        if (server) {
            await new Promise((resolve, reject) => {
                server.close((closeError) => {
                    if (closeError) {
                        reject(closeError)
                    } else {
                        resolve()
                    }
                })
            })
        }
        await disconnectDatabase()
        clearTimeout(forceShutDownTimeout)
        process.exit(error ? 1 : 0)
    } catch (shutdownError) {
        console.error("Shutdown failed: ", shutdownError)
        process.exit(1)
    }
}
process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("uncaughtException", (error) => {
    void shutdown("Uncaught exception", error);
});
process.once("unhandledRejection", (reason) => {
    const error =
        reason instanceof Error ? reason : new Error(String(reason));
    void shutdown("Unhandled rejection", error);
});

await startServer();
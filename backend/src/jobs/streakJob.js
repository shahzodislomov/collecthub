import cron from "node-cron";
import { prisma } from "../config/prisma.js";

export function initCronJobs() {
    cron.schedule("0 0 * * *", async () => {
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            await prisma.habitLog.updateMany({
                where: {
                    date: yesterday,
                    completed: false
                },
                data: {
                    completed: false
                }
            });
        } catch (error) {
            console.error("Error in habit cron job:", error);
        }
    });
}
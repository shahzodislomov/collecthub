import { z } from "zod";
import { prisma } from "../config/prisma.js";

const habitLogSchema = z.object({
    date: z.string().datetime(),
    completed: z.boolean(),
    note: z.string().optional()
});

export async function logHabit(req, res, next) {
    try {
        const { itemId } = req.params;
        const result = habitLogSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ success: false, errors: result.error.flatten().fieldErrors });
        const { date, completed, note } = result.data;
        const dateObj = new Date(date);
        dateObj.setUTCHours(0, 0, 0, 0); 
        const item = await prisma.item.findUnique({ where: { id: itemId } });
        if (!item || item.type !== "habit") {
            return res.status(400).json({ success: false, message: "Invalid item or item is not a habit" });
        }
        const log = await prisma.habitLog.upsert({
            where: {
                itemId_userId_date: { itemId, userId: req.userId, date: dateObj }
            },
            update: { completed, note },
            create: { itemId, userId: req.userId, date: dateObj, completed, note }
        });
        res.status(200).json({ success: true, log });
    } catch (error) {
        next(error);
    }
}

import { Router } from "express";
import { getHabitLogs, logHabit } from "../controllers/habitController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/items/:itemId/habit-logs", authenticate, logHabit);
router.get("/items/:itemId/habit-logs", authenticate, getHabitLogs);
export default router;
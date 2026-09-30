import { Router } from "express";
import { logHabit } from "../controllers/habitController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/items/:itemId/habit-logs", authenticate, logHabit);

export default router;
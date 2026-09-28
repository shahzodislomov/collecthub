import { Router } from "express";
import {
  signup,
  login,
  getCurrentUser,
  changePassword,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authenticate, getCurrentUser);
router.patch("/password", authenticate, changePassword);

export default router;

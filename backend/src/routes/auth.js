import { Router } from "express";
import {
  signup,
  login,
  getCurrentUser,
  changePassword,
  changeEmail,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/auth/signup", signup);
router.post("/auth/login", login);
router.get("/auth/me", authenticate, getCurrentUser);
router.patch("/auth/password", authenticate, changePassword);
router.patch("/auth/email", authenticate, changeEmail);

export default router;

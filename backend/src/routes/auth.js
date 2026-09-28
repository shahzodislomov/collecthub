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

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authenticate, getCurrentUser);
router.patch("/password", authenticate, changePassword);
router.patch("/email", authenticate, changeEmail);

export default router;

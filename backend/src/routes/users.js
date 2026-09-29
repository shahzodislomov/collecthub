import { Router } from "express"
import {
    getPublicProfile,
    updateMyProfile,
    getUserPublicCollections,
} from "../controllers/userController.js"
import { authenticate } from "../middleware/auth.js"

const router = Router()

router.get("/users/:username", getPublicProfile);
router.get("/users/:username/collections", getUserPublicCollections);
router.patch("/users/me", authenticate, updateMyProfile);

export default router

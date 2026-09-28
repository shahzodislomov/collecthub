import { Router } from "express"
import {
    getPublicProfile,
    updateMyProfile,
    getUserPublicCollections,
} from "../controllers/userController.js"
import { authenticate } from "../middleware/auth.js"

const router = Router()

router.get("/:username", getPublicProfile);
router.get("/:username/collections", getUserPublicCollections);
router.patch("/me", authenticate, updateMyProfile);

export default router
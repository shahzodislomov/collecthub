import { Router } from "express"
import {
    getPublicProfile,
    updateMyProfile,
    getUserPublicCollections,
} from "../controllers/userController.js"
import { authenticate } from "../middleware/auth.js"

const router = Router()

router.get("/users/:username", getPublicProfile)
router.patch("/users/me", authenticate, updateMyProfile)
router.get("/users/:username/collections", getUserPublicCollections)

export default router
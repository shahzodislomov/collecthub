import { Router } from "express"
import {
    getPublicProfile,
    updateMyProfile,
    getUserPublicCollections,
    followUser,
    unfollowUser,
} from "../controllers/userController.js"
import { authenticate } from "../middleware/auth.js"

const router = Router()

router.get("/users/:username", getPublicProfile);
router.get("/users/:username/collections", getUserPublicCollections);
router.patch("/users/me", authenticate, updateMyProfile);
router.post("/users/:username/follow", authenticate, followUser);
router.delete("/users/:username/follow", authenticate, unfollowUser);

export default router

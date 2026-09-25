import { Router } from "express"
import {
    createCollection,
    getMyCollections,
    getCollectionById,
    updateCollection,
    deleteCollection,
} from "../controllers/collectionController.js"
import { authenticate } from "../middleware/auth.js";

const router = Router()

router.post("/", authenticate, createCollection);
router.get("/", authenticate, getMyCollections);
router.get("/:id", authenticate, getCollectionById);
router.patch("/:id", authenticate, updateCollection);
router.delete("/:id", authenticate, deleteCollection);

export default router
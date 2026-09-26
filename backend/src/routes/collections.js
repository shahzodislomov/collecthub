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

router.post("/collections", authenticate, createCollection);
router.get("/collections", authenticate, getMyCollections);
router.get("/collections:id", authenticate, getCollectionById);
router.patch("/collections:id", authenticate, updateCollection);
router.delete("/collections:id", authenticate, deleteCollection);

export default router
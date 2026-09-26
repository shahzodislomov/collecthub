import { Router } from "express";

import {
    createItem,
    getItem,
    updateItem,
    deleteItem,
    getCollectionItems,
} from "../controllers/itemController.js";

import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/create", authenticate, createItem);
router.get("/item:id", authenticate, getItem);
router.patch("/item:id", authenticate, updateItem);
router.delete("/item:id", authenticate, deleteItem);
router.get("/collections/:collectionId", authenticate, getCollectionItems);

export default router;

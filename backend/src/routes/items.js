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

router.post("/", authenticate, createItem);
router.get("/:id", authenticate, getItem);
router.patch("/:id", authenticate, updateItem);
router.delete("/:id", authenticate, deleteItem);
router.get("/collection/:collectionId", authenticate, getCollectionItems);

export default router;

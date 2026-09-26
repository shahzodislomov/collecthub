import { Router } from "express"
import {
    createReview,
    getCollectionReviews,
    updateReview,
    deleteReview
} from "../controllers/reviewController.js"
import { authenticate } from "../middleware/auth.js";

const router = Router()

router.post("/collections/:collectionId/reviews", authenticate, createReview);
router.get("/collections/:collectionId/reviews", authenticate, getCollectionReviews);
router.patch("/reviews/:id", authenticate, updateReview);
router.delete("/reviews/:id", authenticate, deleteReview);

export default router

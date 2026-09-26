import { z } from "zod";

import { prisma } from "../config/prisma.js";

const reviewFields = {
    rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
    comment: z.string().trim().max(2000, "Comment is too long").optional(),
};

const createReviewSchema = z.object(reviewFields);

const updateReviewSchema = z
    .object(reviewFields)
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });

const reviewIdSchema = z.object({
    id: z.string().uuid("Review ID must be a valid UUID"),
});

const collectionIdSchema = z.object({
    collectionId: z.string().uuid("Collection ID must be a valid UUID"),
});

function validationError(res, message, error) {
    return res.status(400).json({
        success: false,
        message,
        errors: error.flatten().fieldErrors,
    });
}

export async function createReview(req, res, next) {
    try {
        const paramsResult = collectionIdSchema.safeParse(req.params);
        const bodyResult = createReviewSchema.safeParse(req.body);
        if (!paramsResult.success) {
            return validationError(res, "Invalid collection ID", paramsResult.error);
        }
        if (!bodyResult.success) {
            return validationError(res, "Invalid review data", bodyResult.error);
        }
        const collection = await prisma.collection.findFirst({
            where: { id: paramsResult.data.collectionId, isPublic: true },
            select: { id: true, ownerId: true },
        });
        if (!collection) {
            return res.status(404).json({ success: false, message: "Collection not found" });
        }
        if (collection.ownerId === req.userId) {
            return res.status(403).json({
                success: false,
                message: "You cannot review your own collection",
            });
        }
        const existingReview = await prisma.review.findUnique({
            where: {
                authorId_collectionId: {
                    authorId: req.userId,
                    collectionId: collection.id,
                },
            },
            select: { id: true },
        });
        if (existingReview) {
            return res.status(409).json({
                success: false,
                message: "You have already reviewed this collection",
            });
        }
        const review = await prisma.review.create({
            data: {
                ...bodyResult.data,
                authorId: req.userId,
                collectionId: collection.id,
            },
            include: { author: { select: { id: true, username: true } } },
        });
        return res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            review,
        });
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "You have already reviewed this collection",
            });
        }
        next(error);
    }
}
export async function getCollectionReviews(req, res, next) {
    try {
        const result = collectionIdSchema.safeParse(req.params);
        if (!result.success) {
            return validationError(res, "Invalid collection ID", result.error);
        }
        const collection = await prisma.collection.findFirst({
            where: {
                id: result.data.collectionId,
                OR: [{ ownerId: req.userId }, { isPublic: true }],
            },
            select: { id: true },
        });
        if (!collection) {
            return res.status(404).json({ success: false, message: "Collection not found" });
        }
        const reviews = await prisma.review.findMany({
            where: { collectionId: collection.id },
            orderBy: { createdAt: "desc" },
            include: { author: { select: { id: true, username: true } } },
        });
        return res.status(200).json({ success: true, reviews });
    } catch (error) {
        next(error);
    }
}
export async function updateReview(req, res, next) {
    try {
        const paramsResult = reviewIdSchema.safeParse(req.params);
        const bodyResult = updateReviewSchema.safeParse(req.body);
        if (!paramsResult.success) {
            return validationError(res, "Invalid review ID", paramsResult.error);
        }
        if (!bodyResult.success) {
            return validationError(res, "Invalid update data", bodyResult.error);
        }
        const existingReview = await prisma.review.findFirst({
            where: { id: paramsResult.data.id, authorId: req.userId },
            select: { id: true },
        });
        if (!existingReview) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }
        const review = await prisma.review.update({
            where: { id: existingReview.id },
            data: bodyResult.data,
            include: { author: { select: { id: true, username: true } } },
        });
        return res.status(200).json({
            success: true,
            message: "Review updated successfully",
            review,
        });
    } catch (error) {
        next(error);
    }
}
export async function deleteReview(req, res, next) {
    try {
        const result = reviewIdSchema.safeParse(req.params);
        if (!result.success) {
            return validationError(res, "Invalid review ID", result.error);
        }
        const existingReview = await prisma.review.findFirst({
            where: { id: result.data.id, authorId: req.userId },
            select: { id: true },
        });
        if (!existingReview) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }
        await prisma.review.delete({ where: { id: existingReview.id } });
        return res.status(204).send();
    } catch (error) {
        next(error);
    }
}

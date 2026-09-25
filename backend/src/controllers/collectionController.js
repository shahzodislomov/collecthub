import { z } from "zod"
import { prisma } from "../config/prisma.js"

const collectionFields = {
    title: z.string().trim().min(1, "Title is required").max(200),
    description: z.string().trim().max(2000).optional(),
    isPublic: z.boolean().optional(),
};

const createCollectionSchema = z.object(collectionFields)

const updateCollectionSchema = z
    .object(collectionFields)
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided"
    })

const collectionIdSchema = z.object({
    id: z.string().uuid("Collection ID must be a valid UUID")
})

function validationError(res, message, error) {
    return res.status(400).json({
        success: false,
        message,
        errors: error.flatten().fieldErrors,
    })
}

export async function createCollection(req, res, next) {
    try {
        const result = createCollectionSchema.safeParse(req.body)
        if (!result.success) {
            return validationError(res, "Invalid collection data", result.error)
        }
        const collection = await prisma.collection.create({
            data: {
                ...result.data,
                ownerId: req.userId,
            },
        });
        return res.status(201).json({
            success: true,
            message: "Collection created successfully",
            collection
        })
    } catch (error) {
        next(error)
    }
}

export async function updateCollection(req, res, next) {
    try {
        const paramsResult = collectionIdSchema.safeParse(req.params)
        const bodyResult = updateCollectionSchema.safeParse(req.body)
        if (!paramsResult.success) {
            return validationError(res, "Invalid collection ID", paramsResult.error)
        }
        if (!bodyResult.success) {
            return validationError(res, "Invalid update data", bodyResult.error)
        }
        const existingCollectionItem = await prisma.collection.findFirst({
            where: {
                id: paramsResult.data.id,
                ownerId: req.userId
            },
            select: { id: true },
        })
        if (!existingCollectionItem) {
            return res.status(404).json({
                success: false,
                message: "Collection not found",
            })
        }
        const collection = await prisma.collection.update({
            where: {
                id: existingCollectionItem.id
            },
            data: bodyResult.data
        })
        return res.status(200).json({
            success: true,
            message: "collection updated successfully",
            collection
        })
    } catch (error) {
        next(error)
    }
}

export async function deleteCollection(req, res, next) {
    try {
        const result = collectionIdSchema.safeParse(req.params)
        if (!result.success) {
            return validationError(res, "invalid collection ID", result.error)
        }
        const existingCollection = await prisma.collection.findFirst({
            where: {
                id: result.data.id,
                ownerId: req.userId,
            },
            select: { id: true }
        })
        if (!existingCollection) {
            return res.status(404).json({
                success: false,
                message: "Collection not found",
            });
        }
        await prisma.collection.delete({ where: { id: existingCollection.id } })
        return res.status(200).json({
            success: true,
            message: "Collection deleted successfully",
        })
    } catch (error) {
        next(error)
    }
}

export async function getMyCollections(req, res, next) {
    try {
        const collections = await prisma.collection.findMany({
            where: {
                ownerId: req.userId
            }
        })
        return res.status(200).json({
            success: true,
            collections
        })
    } catch (error) {
        next(error)
    }
}

export async function getCollectionById(req, res, next) {
    try {
        const result = collectionIdSchema.safeParse(req.params)
        if (!result.success) {
            return validationError(res, "invalid collection id", result.error)
        }
        const collection = await prisma.collection.findFirst({
            where: {
                id: result.data.id,
                OR: [
                    { ownerId: req.userId },
                    { isPublic: true },
                ],
            },
        })
        if (!collection) {
            return res.status(404).json({
                success: false,
                message: "collection not found"
            })
        }
        return res.status(200).json({
            success: true,
            message: "collection fetched successfully",
            collection
        })
    } catch (error) {
        next(error)
    }
}
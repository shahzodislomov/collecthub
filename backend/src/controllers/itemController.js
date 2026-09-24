import { z } from "zod";

import { prisma } from "../config/prisma.js";

const itemFields = {
    title: z
        .string()
        .trim()
        .min(1, "Title is required")
        .max(200, "Title is too long"),
    description: z
        .string()
        .trim()
        .max(2000, "Description is too long")
        .optional(),
    url: z.string().trim().url("URL must be valid").max(2000).optional(),
    imageUrl: z
        .string()
        .trim()
        .url("Image URL must be valid")
        .max(2000)
        .optional(),
};

const createItemSchema = z.object({
    ...itemFields,
    collectionId: z.string().uuid("Collection ID must be a valid UUID"),
});

const updateItemSchema = z
    .object(itemFields)
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });

const itemIdSchema = z.object({
    id: z.string().uuid("Item ID must be a valid UUID"),
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

export async function createItem(req, res, next) {
    try {
        const result = createItemSchema.safeParse(req.body);
        if (!result.success) {
            return validationError(res, "Invalid item data", result.error);
        }
        const { collectionId, ...itemData } = result.data;
        const collection = await prisma.collection.findFirst({
            where: { id: collectionId, ownerId: req.userId },
            select: { id: true },
        });
        if (!collection) {
            return res.status(404).json({
                success: false,
                message: "Collection not found",
            });
        }
        const item = await prisma.item.create({
            data: { ...itemData, collectionId },
        });
        return res.status(201).json({
            success: true,
            message: "Item created successfully",
            item,
        });
    } catch (error) {
        next(error);
    }
}

export async function getItem(req, res, next) {
    try {
        const result = itemIdSchema.safeParse(req.params);
        if (!result.success) {
            return validationError(res, "Invalid item ID", result.error);
        }
        const item = await prisma.item.findFirst({
            where: {
                id: result.data.id,
                collection: {
                    is: { OR: [{ ownerId: req.userId }, { isPublic: true }] },
                },
            },
            include: {
                collection: {
                    select: { id: true, title: true, isPublic: true, ownerId: true },
                },
            },
        });
        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found",
            });
        }
        return res.status(200).json({ success: true, item });
    } catch (error) {
        next(error);
    }
}

export async function updateItem(req, res, next) {
    try {
        const paramsResult = itemIdSchema.safeParse(req.params);
        const bodyResult = updateItemSchema.safeParse(req.body);
        if (!paramsResult.success) {
            return validationError(res, "Invalid item ID", paramsResult.error);
        }
        if (!bodyResult.success) {
            return validationError(res, "Invalid update data", bodyResult.error);
        }
        const existingItem = await prisma.item.findFirst({
            where: {
                id: paramsResult.data.id,
                collection: { is: { ownerId: req.userId } },
            },
            select: { id: true },
        });
        if (!existingItem) {
            return res.status(404).json({
                success: false,
                message: "Item not found",
            });
        }
        const item = await prisma.item.update({
            where: { id: existingItem.id },
            data: bodyResult.data,
        });
        return res.status(200).json({
            success: true,
            message: "Item updated successfully",
            item,
        });
    } catch (error) {
        next(error);
    }
}

export async function deleteItem(req, res, next) {
    try {
        const result = itemIdSchema.safeParse(req.params);
        if (!result.success) {
            return validationError(res, "Invalid item ID", result.error);
        }
        const existingItem = await prisma.item.findFirst({
            where: {
                id: result.data.id,
                collection: { is: { ownerId: req.userId } },
            },
            select: { id: true },
        });
        if (!existingItem) {
            return res.status(404).json({
                success: false,
                message: "Item not found",
            });
        }
        await prisma.item.delete({ where: { id: existingItem.id } });
        return res.status(204).send();
    } catch (error) {
        next(error);
    }
}

export async function getCollectionItems(req, res, next) {
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
            return res.status(404).json({
                success: false,
                message: "Collection not found",
            });
        }
        const items = await prisma.item.findMany({
            where: { collectionId: collection.id },
            orderBy: { createdAt: "desc" },
        });
        return res.status(200).json({ success: true, items });
    } catch (error) {
        next(error);
    }
}

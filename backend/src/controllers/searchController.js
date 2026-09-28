import { z } from "zod"
import { prisma } from "../config/prisma.js"

const searchQuerySchema = z.object({
    q: z.string().trim().min(2).max(100),
    type: z.enum(["all", "collections", "items"]).default("all"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
})

export async function searchCollections(q, skip, take) {
    return prisma.collection.findMany({
        where: {
            isPublic: true,
            OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } }
            ]
        },
        select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
            owner: {
                select: {
                    id: true,
                    username: true
                }
            },
            _count: {
                select: { items: true }
            }
        },
        skip,
        take,
        orderBy: { createdAt: "desc" }
    })
}

export async function countCollections(q) {
    return prisma.collection.count({
        where: {
            isPublic: true,
            OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
            ]
        }
    })
}
export async function searchItems(q, skip, take) {
    return prisma.item.findMany({
        where: {
            collection: {
                is: { isPublic: true },
            },
            OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
            ],
        },
        select: {
            id: true,
            title: true,
            description: true,
            url: true,
            imageUrl: true,
            createdAt: true,
            collection: {
                select: {
                    id: true,
                    title: true,
                    owner: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                },
            },
        },
        skip,
        take,
        orderBy: { createdAt: "desc" },
    });
}
export async function countItems(q) {
    return prisma.item.count({
        where: {
            collection: {
                isPublic: true
            },
            OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
            ]
        }
    })
}
function validationError(res, message, error) {
    return res.status(400).json({
        success: false,
        message,
        errors: error.flatten().fieldErrors,
    })
}
export async function search(req, res, next) {
    try {
        const result = searchQuerySchema.safeParse(req.query)
        if (!result.success) {
            return validationError(res, "Invalid search parameters", result.error)
        }
        const { q, type, page, limit } = result.data
        const skip = (page - 1) * limit
        let collections = []
        let items = []
        let collectionCount = []
        let itemCount = []
        if (type === "all" || type === "collections") {
            [collections, collectionCount] = await Promise.all([
                searchCollections(q, skip, limit),
                countCollections(q)
            ])
        }
        if (type === "all" || type === "items") {
            [items, itemCount] = await Promise.all([
                searchItems(q, skip, limit),
                countItems(q)
            ])
        }
        const results = {
            ...(type === "all" || type === "collections" ? {
                collections: {
                    data: collections,
                    pagination: {
                        page,
                        limit,
                        total: collectionCount,
                        pages: Math.ceil(collectionCount / limit),
                    }
                }
            } : {}),
            ...(type === "all" || type === "items" ? {
                items: {
                    data: items,
                    pagination: {
                        page,
                        limit,
                        total: itemCount,
                        pages: Math.ceil(itemCount / limit)
                    }
                }
            } : {})
        }
        return res.json({
            success: true,
            query: q,
            type,
            ...results,
        })
    } catch (error) {
        next(error)
    }
}
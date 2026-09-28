import { success, z } from "zod";
import { prisma } from "../config/prisma";

const updateProfileSchema = z
    .object({
        username: z.string().trim().min(3).max(30).optional(),
        bio: z.string().trim().max(500).optional(),
        avatarUrl: z.string().trim().url().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });

export async function getPublicProfile(req, res, next) {
    try {
        const { username } = req.params
        const user = await prisma.user.findUnique({
            where: {
                username
            },
            select: {
                id: true,
                username: true,
                createdAt: true,
                _count: {
                    select: {
                        collections: {
                            where: { isPublic: true },
                        },
                    },
                },
            }
        })
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }
        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                createdAt: user.createdAt,
                publicCollectionCount: user._count.collections,
            }
        })
    } catch (error) {
        next(error)
    }
}

export async function updateMyProfile(req, res, next) {
    try {
        const result = updateProfileSchema.safeParse(req.body)
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid profile data",
                errors: result.error.flatten().fieldErrors,
            })
        }
        const user = await prisma.user.update({
            where: {
                id: req.userId,
            },
            data: result.data,
            select: {
                id: true,
                username: true,
                createdAt: true,
            }
        })
        return res.status(200).json({
            success: true,
            message: "Profile updated carefully",
        })
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "Username is already taken"
            })
        }
        next(error)
    }
}

export async function getUserPublicCollections(req, res, next) {
    try {
        const { username } = req.params
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
        const skip = (page - 1) * limit

        const user = await prisma.user.findUnique({
            where: {
                username
            }
        })
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "user not found",
            })
        }
        const [collections, total] = await Promise.all([
            prisma.collection.findMany({
                where: {
                    ownerId: user.id,
                    isPublic: true
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    createdAt: true,
                    _count: {
                        select: { items: true }
                    }
                },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" }
            }),
            prisma.collection.count({
                where: {
                    ownerId: user.userId,
                    isPublic: true
                }
            })
        ])
        return res.json({
            success: true,
            username,
            collections,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        next(error)
    }
}
import { z } from "zod";

import { prisma } from "../config/prisma.js";

const updateProfileSchema = z
    .object({
        username: z.string().trim().min(3).max(30).optional(),
        bio: z.string().trim().max(500).optional(),
        avatarUrl: z.string().trim().url().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });

const usernameParamsSchema = z.object({
    username: z.string().trim().min(1).max(50),
});

const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

function validationError(res, message, error) {
    return res.status(400).json({
        success: false,
        message,
        errors: error.flatten().fieldErrors,
    });
}

export async function getPublicProfile(req, res, next) {
    try {
        const result = usernameParamsSchema.safeParse(req.params);
        if (!result.success) {
            return validationError(res, "Invalid username", result.error);
        }

        const user = await prisma.user.findUnique({
            where: { username: result.data.username },
            select: {
                id: true,
                username: true,
                bio: true,
                avatarUrl: true,
                createdAt: true,
                _count: {
                    select: {
                        collections: { where: { isPublic: true } },
                    },
                },
            },
        });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                bio: user.bio,
                avatarUrl: user.avatarUrl,
                createdAt: user.createdAt,
                publicCollectionCount: user._count.collections,
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function updateMyProfile(req, res, next) {
    try {
        const result = updateProfileSchema.safeParse(req.body);
        if (!result.success) {
            return validationError(res, "Invalid profile data", result.error);
        }

        const user = await prisma.user.update({
            where: { id: req.userId },
            data: result.data,
            select: {
                id: true,
                username: true,
                bio: true,
                avatarUrl: true,
                email: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user,
        });
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "Username is already taken",
            });
        }
        if (error.code === "P2025") {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        next(error);
    }
}

export async function getUserPublicCollections(req, res, next) {
    try {
        const paramsResult = usernameParamsSchema.safeParse(req.params);
        const queryResult = paginationSchema.safeParse(req.query);
        if (!paramsResult.success) {
            return validationError(res, "Invalid username", paramsResult.error);
        }
        if (!queryResult.success) {
            return validationError(res, "Invalid pagination", queryResult.error);
        }

        const user = await prisma.user.findUnique({
            where: { username: paramsResult.data.username },
            select: { id: true, username: true },
        });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { page, limit } = queryResult.data;
        const where = { ownerId: user.id, isPublic: true };
        const [collections, total] = await Promise.all([
            prisma.collection.findMany({
                where,
                select: {
                    id: true,
                    title: true,
                    description: true,
                    createdAt: true,
                    _count: { select: { items: true } },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.collection.count({ where }),
        ]);

        return res.status(200).json({
            success: true,
            username: user.username,
            collections,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function followUser(req, res, next) {
    try {
        const paramsResult = usernameParamsSchema.safeParse(req.params)
        if (!paramsResult.success) {
            return validationError(res, "invalid username", paramsResult.error)
        }
        const targetUser = await prisma.user.findUnique({
            where: { username: paramsResult.data.username }
        })
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "user not found"
            })
        }
        if (targetUser.id === req.userId) {
            return res.status(400).json({
                success: false,
                message: "you cannot follow yourself"
            })
        }
        const follow = await prisma.follows.create({
            data: {
                followerId: req.userId,
                followingId: targetUser.id
            }
        })
        return res.status(200).json({
            success: true,
            message: "user followed successfully",
            follow
        })
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(400).json({
                success: false,
                message: "you are already following this user"
            })
        }
        next(error)
    }
}
export async function unfollowUser(req, res, next) {
    try {
        const paramsResult = usernameParamsSchema.safeParse(req.params)
        if (!paramsResult.success) {
            return validationError(res, "invalid username", paramsResult.error)
        }
        const targetUser = await prisma.user.findUnique({
            where: { username: paramsResult.data.username }
        })
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "user not found"
            })
        }
        const unfollow = await prisma.follows.delete({
            where:{
                followerId_followingId:{
                    followerId:req.userId,
                    followingId:targetUser.id
                }
            }
        })
        return res.status(200).json({
            success: true,
            message: `successfully unfollowed ${targetUser.username}`
        })    
    } catch (error) {
        if(error.code === "P2025"){
            return res.status(400).json({
                success:false,
                message:"you are not following this user"
            })
        }
        next(error)
    }
}
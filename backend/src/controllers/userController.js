import { z } from "zod";

const updateProfileSchema = z
    .object({
        username: z.string().trim().min(3).max(30).optional(),
        bio: z.string().trim().max(500).optional(),
        avatarUrl: z.string().trim().url().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });
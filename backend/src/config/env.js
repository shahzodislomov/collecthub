import "dotenv/config"
import { z } from "zod"

const envSchema  = z.object({
    NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
    PORT: z.coerce.number().int().positive().max(65535).default(5000),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required").refine((url) => url.startsWith("postgresql://") || url.startsWith("postgres://"), "DATABASE_URL must be a PostgreSQL connection URL"),
    JWT_SECRET: z.string().min(6, "JWT_SECRET must be at least 6 characters long"),
    JWT_EXPIRES_IN: z.string().default("7d"),
    CORS_ORIGIN: z.string().url().default("http://localhost:3000"),
    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
})

const result = envSchema.safeParse(process.env)
if(!result.success){
    console.error("Invalid environment variables: ", result.error.format())
    for (const issue of result.error.issues){
        console.error(`- ${issue.path.join(".")}: ${issue.message}`)
    }
    process.exit(1)
}
export const env = result.data
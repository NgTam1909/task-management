import { z } from "zod"

export const createProjectSchema = z.object({

    title: z
        .string()
        .min(3, "Tên dự án phải có ít nhất 3 ký tự."),
    description: z.string().optional(),
    visibility: z.enum(["public", "private"]),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

export const updateProjectSchema = z.object({
    title: z
        .string()
        .min(3, "Tên dự án phải có ít nhất 3 ký tự."),
    projectId: z.string().min(3, "Mã dự án phải có ít nhất 3 ký tự."),
    description: z.string().optional(),
    visibility: z.enum(["public", "private"]),
})

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>

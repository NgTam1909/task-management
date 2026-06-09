import { z } from "zod"
const dateFromInput = (value: string) => new Date(`${value}T00:00:00`)
export const createProjectSchema = z.object({
    title: z
        .string()
        .min(3, "Tên dự án phải có ít nhất 3 ký tự."),
    description: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    visibility: z.enum(["public", "private"]),
}).superRefine((data, ctx) => {
    if (data.startDate && data.endDate) {
        const start = dateFromInput(data.startDate)
        const end = dateFromInput(data.endDate)
        if (start > end) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Ngày bắt đầu không được sau ngày kết thúc",
                path: ["startDate"],
            })
        }
    }

    // if (data.endDate) {
    //     const today = new Date()
    //     today.setHours(0, 0, 0, 0)
    //     const due = dateFromInput(data.endDate)
    //     if (due < today) {
    //         ctx.addIssue({
    //             code: z.ZodIssueCode.custom,
    //             message: "Ngày kết thúc không được trước ngày hiện tại",
    //             path: ["endDate"],
    //         })
    //     }
    // }
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

export const updateProjectSchema = z.object({
    title: z
        .string()
        .min(3, "Tên dự án phải có ít nhất 3 ký tự."),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    description: z.string().optional(),
    visibility: z.enum(["public", "private"]),
})    .superRefine((data, ctx) => {
    if (data.startDate && data.endDate) {
        const start = dateFromInput(data.startDate)
        const end = dateFromInput(data.endDate)
        if (start > end) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Ngày bắt đầu không được sau ngày kết thúc",
                path: ["startDate"],
            })
        }
    }

    // if (data.endDate) {
    //     const today = new Date()
    //     today.setHours(0, 0, 0, 0)
    //     const due = dateFromInput(data.endDate)
    //     if (due < today) {
    //         ctx.addIssue({
    //             code: z.ZodIssueCode.custom,
    //             message: "Ngày kết thúc không được trước ngày hiện tại",
    //             path: ["endDate"],
    //         })
    //     }
    // }
})

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>

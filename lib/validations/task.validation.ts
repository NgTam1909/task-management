import { z } from "zod"
import { PriorityLevel, TaskStatus } from "@/types/task"

const dateFromInput = (value: string) => new Date(`${value}T00:00:00`)

export const createTaskSchema = z.object({
    title: z.string().min(1, "Tiêu đề không được để trống"),
    description: z.string().optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(PriorityLevel).optional(),
    projectId: z.string().min(1, "Thiếu project"),
    parentId: z.string().optional(),
    ownerId: z.string().optional(),
    assignees: z.array(z.string()).optional(),
    labels: z.array(z.string()).optional(),
    startDate: z.string().optional(),
    dueDate: z.string().optional(),
    estimate: z.number().optional(),
}).superRefine((data, ctx) => {
    if (data.estimate !== undefined && data.estimate < 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Estimate không được âm",
            path: ["estimate"],
        })
    }

    if (data.startDate && data.dueDate) {
        const start = dateFromInput(data.startDate)
        const due = dateFromInput(data.dueDate)
        if (start > due) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Ngày bắt đầu không được sau ngày kết thúc",
                path: ["startDate"],
            })
        }
    }

    if (data.dueDate) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const due = dateFromInput(data.dueDate)
        if (due < today) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Ngày kết thúc không được trước ngày hiện tại",
                path: ["dueDate"],
            })
        }
    }
    if (
        data.ownerId &&
        data.assignees &&
        data.assignees.length > 0
    ) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
                "Không được gửi đồng thời ownerId và assignees",
            path: ["ownerId"],
        })
    }
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>

export const updateTaskSchema = z
    .object({
        title: z.string().min(1, "Tiêu đề không được để trống").optional(),
        description: z.string().optional(),
        status: z.nativeEnum(TaskStatus).optional(),
        priority: z.nativeEnum(PriorityLevel).optional(),
        ownerId: z.string().optional(),
        assignees: z.array(z.string()).optional(),
        labels: z.array(z.string()).optional(),
        startDate: z.string().optional(),
        dueDate: z.string().optional(),
        estimate: z.number().nullable().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.estimate !== undefined && data.estimate !== null && data.estimate < 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Estimate không được âm",
                path: ["estimate"],
            })
        }

        const hasStart = data.startDate && data.startDate.trim().length > 0
        const hasDue = data.dueDate && data.dueDate.trim().length > 0

        if (hasStart && hasDue) {
            const start = dateFromInput(data.startDate as string)
            const due = dateFromInput(data.dueDate as string)
            if (start > due) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Ngày bắt đầu không được sau ngày kết thúc",
                    path: ["startDate"],
                })
            }
        }

        if (hasDue) {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const due = dateFromInput(data.dueDate as string)
            if (due < today) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Ngày kết thúc không được trước ngày hiện tại",
                    path: ["dueDate"],
                })
            }
        }
    })

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>

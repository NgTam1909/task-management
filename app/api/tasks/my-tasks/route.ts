//api/tasks/my-tasks
import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Project from "@/models/project.model"
import TaskModel from "@/models/task.model"
import {getUserIdFromRequest} from "@/lib/jwt";

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}


function parseDateOnly(value: string) {
    // Accept YYYY-MM-DD or any Date.parse() compatible string; normalize to start of day.
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return null
    d.setHours(0, 0, 0, 0)
    return d
}

export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req)
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const params = req.nextUrl.searchParams
        const statusParam = params.get("status")?.trim()
        const priorityParam = params.get("priority")?.trim()
        const dueDateBefore = params.get("dueDateBefore")?.trim()
        const dueDateAfter = params.get("dueDateAfter")?.trim()
        const search = params.get("search")?.trim()

        const userObjectId = new mongoose.Types.ObjectId(userId)
        const query: Record<string, unknown> = {
            $or: [{ assignees: userObjectId }, { creatorId: userObjectId }],
        }

        if (statusParam) {
            const values = statusParam
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
            if (values.length > 0) query.status = { $in: values }
        }

        if (priorityParam) {
            const values = priorityParam
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
            if (values.length > 0) query.priority = { $in: values }
        }

        if (dueDateBefore || dueDateAfter) {
            const dueQuery: Record<string, unknown> = {}

            if (dueDateAfter) {
                const after = parseDateOnly(dueDateAfter)
                if (after) dueQuery.$gte = after
            }
            if (dueDateBefore) {
                const before = parseDateOnly(dueDateBefore)
                if (before) {
                    // Inclusive end-of-day.
                    const end = new Date(before)
                    end.setHours(23, 59, 59, 999)
                    dueQuery.$lte = end
                }
            }

            if (Object.keys(dueQuery).length > 0) {
                query.dueDate = dueQuery
            }
        }

        if (search) {
            const safe = escapeRegex(search)
            query.$and = [
                ...(Array.isArray(query.$and) ? (query.$and as unknown[]) : []),
                {
                    $or: [
                        { title: { $regex: safe, $options: "i" } },
                        { description: { $regex: safe, $options: "i" } },
                    ],
                },
            ]
        }

        await dbConnect()

        const docs = await TaskModel.find(query)
            .select("code title status priority startDate dueDate startedAt completedAt projectId assignees creatorId createdAt updatedAt")
            .sort({ dueDate: 1, createdAt: -1 })
            .lean()

        const projectObjectIds = Array.from(
            new Set(
                docs
                    .map((doc) => String((doc as unknown as Record<string, unknown>).projectId ?? ""))
                    .filter(Boolean)
            )
        )

        const projects = projectObjectIds.length
            ? await Project.find({ _id: { $in: projectObjectIds } })
                  .select("_id projectId")
                  .lean()
            : []

        const projectIdMap = new Map(
            projects
                .map((p) => {
                    const record = p as unknown as Record<string, unknown>
                    const id = String(record._id ?? "")
                    const projectId = typeof record.projectId === "string" ? record.projectId : ""
                    return [id, projectId] as const
                })
                .filter((entry) => entry[0] && entry[1])
        )

        const tasks = docs
            .map((doc) => {
            const record = doc as unknown as Record<string, unknown>

            const id = String(record._id ?? "")
                const code =
                    typeof record.code === "string"
                        ? record.code
                        : ""
            const title = typeof record.title === "string" ? record.title : ""
            const status = record.status
            const priority = record.priority
            const startDateRaw = record.startDate
            const startDate =
                startDateRaw instanceof Date
                    ? startDateRaw.toISOString()
                    : typeof startDateRaw === "string"
                      ? startDateRaw
                      : undefined
                const dueDateRaw = record.dueDate
                const dueDate =
                    dueDateRaw instanceof Date
                        ? dueDateRaw.toISOString()
                        : typeof dueDateRaw === "string"
                            ? dueDateRaw
                            : undefined
            const projectObjectId = record.projectId ? String(record.projectId) : ""
            const projectId = projectObjectId ? projectIdMap.get(projectObjectId) : undefined
            if (!projectId) {
                // Hide tasks whose project has been deleted (or otherwise cannot be resolved).
                return null
            }

            const assigneeIds = Array.isArray(record.assignees)
                ? record.assignees.map((value) => String(value))
                : []

            const createdAtRaw = record.createdAt
            const updatedAtRaw = record.updatedAt
                const startedAtRaw = record.startedAt
                const completedAtRaw = record.completedAt
            return {
                id,
                code,
                title,
                status,
                priority,
                startDate,
                dueDate,
                projectId,
                assigneeIds,
                assignees: assigneeIds,
                startedAt:
                    startedAtRaw instanceof Date
                        ? startedAtRaw.toISOString()
                        : typeof startedAtRaw === "string"
                            ? startedAtRaw
                            : undefined,

                completedAt:
                    completedAtRaw instanceof Date
                        ? completedAtRaw.toISOString()
                        : typeof completedAtRaw === "string"
                            ? completedAtRaw
                            : undefined,
                createdAt:
                    createdAtRaw instanceof Date
                        ? createdAtRaw.toISOString()
                        : typeof createdAtRaw === "string"
                          ? createdAtRaw
                          : undefined,
                updatedAt:
                    updatedAtRaw instanceof Date
                        ? updatedAtRaw.toISOString()
                        : typeof updatedAtRaw === "string"
                          ? updatedAtRaw
                          : undefined,
            }
            })
            .filter((task): task is NonNullable<typeof task> => task !== null)

        return NextResponse.json({ tasks })
    } catch {
        return NextResponse.json(
            { message: "Không thể tải danh sách công việc" },
            { status: 500 }
        )
    }
}

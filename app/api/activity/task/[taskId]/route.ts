import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import dbConnect from "@/lib/db"
import ActivityLog from "@/models/activityLog.model"
import Task from "@/models/task.model"
import Project from "@/models/project.model"
import {PopulatedUser} from "@/types/user"
import {getUserIdFromRequest} from "@/lib/jwt";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const userId = await getUserIdFromRequest(req)
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const { taskId } = await params
        if (!taskId) {
            return NextResponse.json({ message: "Thiếu taskId" }, { status: 400 })
        }

        await dbConnect()

        if (!mongoose.isValidObjectId(taskId)) {
            return NextResponse.json({ message: "Task không hợp lệ" }, { status: 400 })
        }

        const task = await Task.findById(taskId)
        if (!task) {
            return NextResponse.json({ message: "Không tìm thấy task" }, { status: 404 })
        }

        const project = await Project.findById(task.projectId)
        if (!project) {
            return NextResponse.json({ message: "Không tìm thấy dự án" }, { status: 404 })
        }

        const isMember =
            project.owner?.userId?.toString() === userId ||
            project.members?.some((m) => m.userId?.toString() === userId)

        if (!isMember) {
            return NextResponse.json({ message: "Người dùng không phải thành viên dự án" }, { status: 403 })
        }

        const logs = await ActivityLog.find({
            entityType: "Task",
            entityId: task._id,
        })
            .populate("userId", "firstName lastName email")
            .sort({ createdAt: -1 })
            .limit(20)
            .lean()

        const formatted = logs.map((log) => {
            const userDoc = log.userId as PopulatedUser | null
            const user =
                userDoc && typeof userDoc === "object" && "firstName" in userDoc
                    ? {
                          id: userDoc._id?.toString?.() ?? "",
                          name: `${userDoc.lastName ?? ""} ${userDoc.firstName ?? ""}`.trim(),
                          email: userDoc.email ?? null,
                      }
                    : null

            return {
                id: log._id.toString(),
                action: log.action,
                entityType: log.entityType,
                entityId: log.entityId?.toString() ?? null,
                createdAt:
                    log.createdAt instanceof Date
                        ? log.createdAt.toISOString()
                        : new Date(log.createdAt).toISOString(),
                oldValue: log.oldValue ?? null,
                newValue: log.newValue ?? null,
                metadata: log.metadata ?? null,
                user,
            }
        })

        return NextResponse.json({ logs: formatted })
    } catch {
        return NextResponse.json(
            { message: "Không thể lấy log audit" },
            { status: 500 }
        )
    }
}

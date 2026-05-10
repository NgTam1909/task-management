import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { connectDB } from "@/lib/db"
import Project from "@/models/project.model"
import Task from "@/models/task.model"
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

        await connectDB()

        const parent = await Task.findById(taskId).select("_id projectId").lean()
        if (!parent) {
            return NextResponse.json({ message: "Không tìm thấy task" }, { status: 404 })
        }

        const project = await Project.findById(parent.projectId).select("owner members").lean()
        if (!project) {
            return NextResponse.json({ message: "Không tìm thấy dự án" }, { status: 404 })
        }

        const isMember =
            project.owner?.userId?.toString() === userId ||
            project.members?.some((m: any) => m.userId?.toString() === userId)

        if (!isMember) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        const subtasks = await Task.find({ parentId: parent._id })
            .populate("assignees", "firstName lastName email")
            .sort({ createdAt: -1 })
            .lean()

        return NextResponse.json({ subtasks })
    } catch {
        return NextResponse.json(
            { message: "Không thể tải task con" },
            { status: 500 }
        )
    }
}


// Lấy thông tin task cơ bản
import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Project from "@/models/project.model"
import Task from "@/models/task.model"
import {getUserIdFromRequest} from "@/lib/jwt";
import { syncTaskOverdue } from "@/lib/syncTaskActivity"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const userId = await getUserIdFromRequest(req)
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const { projectId } = await params
        if (!projectId) {
            return NextResponse.json({ message: "Không thấy projectId" }, { status: 400 })
        }

        await dbConnect()

        const project = await Project.findOne({ projectId, isActive: true })
        if (!project) {
            return NextResponse.json({ message: "Không tìm thấy dự án" }, { status: 404 })
        }

        const isMember =
            project.owner?.userId?.toString() === userId ||
            project.members?.some((m) => m.userId?.toString() === userId)

        if (!isMember) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        const tasks = await Task.find({ projectId: project._id })
            .populate("assignees", "firstName lastName email")
            .populate("ownerId", "firstName lastName email")
            .sort({ createdAt: -1 })

        for (const task of tasks) {
            try {
                await syncTaskOverdue(task)
            } catch {
                // không để overdue sync làm crash API
            }
        }

        return NextResponse.json({
            project: {
                title: project.title,
                projectId: project.projectId,
                startDate: project.startDate,
                endDate: project.endDate,
                description: project.description
            },
            tasks: tasks.map((task) => task.toObject()),
        })
    } catch {
        return NextResponse.json(
            { message: "Không tìm thấy task" },
            { status: 500 }
        )
    }
}

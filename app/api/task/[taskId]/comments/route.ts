import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { jwtVerify } from "jose"
import dbConnect from "@/lib/db"
import Task from "@/models/task.model"
import Project from "@/models/project.model"
import {PopulatedUser} from "@/types/user"

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)


async function getUserIdFromRequest(req: NextRequest) {
    const token = req.cookies.get("accessToken")?.value
    if (!token) return null

    try {
        const { payload } = await jwtVerify(token, SECRET)
        const id = (payload.id || payload.userId) as string | undefined
        return id ?? null
    } catch {
        return null
    }
}

async function getTaskWithAccess(req: NextRequest, taskId: string) {
    const userId = await getUserIdFromRequest(req)
    if (!userId) {
        return {
            error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
        }
    }

    if (!mongoose.isValidObjectId(taskId)) {
        return {
            error: NextResponse.json({ message: "Task không hợp lệ" }, { status: 400 }),
        }
    }

    await dbConnect()

    const task = await Task.findById(taskId)
    if (!task) {
        return {
            error: NextResponse.json({ message: "Không tìm thấy task" }, { status: 404 }),
        }
    }

    const project = await Project.findById(task.projectId)
    if (!project) {
        return {
            error: NextResponse.json({ message: "Không tìm thấy dự án" }, { status: 404 }),
        }
    }

    const isMember =
        project.owner?.userId?.toString() === userId ||
        project.members?.some((member) => member.userId?.toString() === userId)

    if (!isMember) {
        return {
            error: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
        }
    }

    return { task, userId }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params
        const access = await getTaskWithAccess(req, taskId)
        if ("error" in access) {
            return access.error
        }

        const task = await Task.findById(taskId)
            .populate("comments.userId", "firstName lastName email")
            .lean()

        const comments = Array.isArray(task?.comments)
            ? task.comments
                  .map((comment) => {
                      const userDoc = comment.userId as PopulatedUser | null
                      const user =
                          userDoc && typeof userDoc === "object" && "_id" in userDoc
                              ? {
                                    id: userDoc._id?.toString?.() ?? "",
                                    name: `${userDoc.lastName ?? ""} ${userDoc.firstName ?? ""}`.trim(),
                                    email: userDoc.email ?? null,
                                }
                              : null

                      return {
                          id: comment._id?.toString?.() ?? `${comment.createdAt}`,
                          content: comment.content,
                          createdAt:
                              comment.createdAt instanceof Date
                                  ? comment.createdAt.toISOString()
                                  : new Date(comment.createdAt).toISOString(),
                          user,
                      }
                  })
                  .sort(
                      (a, b) =>
                          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                  )
            : []

        return NextResponse.json({ comments })
    } catch {
        return NextResponse.json(
            { message: "Không thể lấy bình luận task" },
            { status: 500 }
        )
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params
        const access = await getTaskWithAccess(req, taskId)
        if ("error" in access) {
            return access.error
        }

        const body = (await req.json()) as { content?: string }
        const content = body.content?.trim()

        if (!content) {
            return NextResponse.json(
                { message: "Bình luận không được để trống" },
                { status: 400 }
            )
        }

        access.task.comments = [
            ...(Array.isArray(access.task.comments) ? access.task.comments : []),
            {
                userId: new mongoose.Types.ObjectId(access.userId),
                content,
                createdAt: new Date(),
            },
        ]

        await access.task.save()

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json(
            { message: "Không thể tạo bình luận task" },
            { status: 500 }
        )
    }
}

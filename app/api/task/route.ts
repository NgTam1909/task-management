// api tạo task
import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import dbConnect from "@/lib/db"
import Task from "@/models/task.model"
import Project, { IProjectMember } from "@/models/project.model"
import {ProjectRole} from "@/types/project";
import { createTaskSchema } from "@/lib/validations/task.validation"
import ActivityLog, { ActivityAction } from "@/models/activityLog.model"
import {getUserIdFromRequest} from "@/lib/jwt";
import {TaskStatus} from "@/types/task";
import {generateTaskCode} from "@/lib/generateId";
export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req)
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        await dbConnect()

        const body = await req.json()
        const parsed = createTaskSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { message: "Dữ liệu không hợp lệ", errors: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const data = parsed.data
        const rawProjectId = data.projectId as string | undefined
        const rawParentId = data.parentId as string | undefined

        if (!rawProjectId) {
            return NextResponse.json({ message: "Thiếu project" }, { status: 400 })
        }

        let project = await Project.findOne({ projectId: rawProjectId, isActive: true})
        if (!project && mongoose.isValidObjectId(rawProjectId)) {
            project = await Project.findById(rawProjectId)
        }

        if (!project) {
            return NextResponse.json({ message: "Không tìm thấy dự án" }, { status: 404 })
        }

        let parentTask:
            | {
            _id: mongoose.Types.ObjectId
            projectId: mongoose.Types.ObjectId
            status: TaskStatus
            parentId?: mongoose.Types.ObjectId | null
        }
            | null = null

        if (rawParentId) {
            if (!mongoose.isValidObjectId(rawParentId)) {
                return NextResponse.json({ message: "parentId không hợp lệ" }, { status: 400 })
            }

            parentTask = await Task.findById(rawParentId)
                .select("_id projectId status parentId")
                .lean()

            if (!parentTask) {
                return NextResponse.json({ message: "Không tìm thấy task cha" }, { status: 404 })
            }

            if (parentTask.projectId.toString() !== project._id.toString()) {
                return NextResponse.json(
                    { message: "Task cha không thuộc project này" },
                    { status: 400 }
                )
            }

            if (parentTask.parentId) {
                return NextResponse.json(
                    { message: "Không hỗ trợ tạo task con nhiều cấp" },
                    { status: 400 }
                )
            }

            if (parentTask.status === TaskStatus.CANCELLED) {
                return NextResponse.json(
                    { message: "Task cha đã cancelled, không thể tạo task con" },
                    { status: 400 }
                )
            }
        }

        let currentRole: ProjectRole | null 
        if (project.owner?.userId?.toString() === userId) {
            currentRole = project.owner.role
        } else {
            const member = project.members.find((m: IProjectMember) => m.userId?.toString() === userId)
            currentRole = member?.role ?? null
        }

        if (!currentRole) {
            return NextResponse.json({ message: "Quyền người dùng không hợp lệ" }, { status: 403 })
        }

        const ownerId = project.owner.userId.toString()
        const memberIds = project.members.map((m: IProjectMember) => m.userId.toString())
        const allIds = Array.from(new Set([ownerId, ...memberIds]))

        let assignableIds: string[] = []
        if (currentRole === ProjectRole.MEMBER) {
            assignableIds = [userId]
        } else if (currentRole === ProjectRole.LEADER) {
            const memberOnlyIds = project.members
                .filter((m: IProjectMember) => m.role === ProjectRole.MEMBER)
                .map((m: IProjectMember) => m.userId.toString())
            assignableIds = Array.from(new Set([userId, ...memberOnlyIds]))
        } else {
            assignableIds = allIds
        }

        const requestedAssignees = data.assignees && data.assignees.length > 0 ? data.assignees : []
        const invalidAssignees = requestedAssignees.filter(
            (assigneeId) => !assignableIds.includes(assigneeId)
        )

        if (invalidAssignees.length > 0) {
            return NextResponse.json(
                { message: "Không có quyền gán người thực hiện này" },
                { status: 403 }
            )
        }
        let taskOwnerId: string
        let taskAssignees: string[]

// MEMBER
        if (currentRole === ProjectRole.MEMBER) {
            taskOwnerId = userId
            taskAssignees = [userId]
        }
// LEADER
        else if (currentRole === ProjectRole.LEADER) {
            taskOwnerId = userId

            taskAssignees =
                requestedAssignees.length > 0
                    ? requestedAssignees
                    : [userId]
        }
// ADMIN
        else {
            const selectedUser =
                requestedAssignees.length > 0
                    ? requestedAssignees[0]
                    : userId

            taskOwnerId = selectedUser
            taskAssignees = [selectedUser]
        }
        const taskCode = await generateTaskCode(
            project.projectId
        )
        const task = new Task({
            ...data,
            code: taskCode,
            projectId: project._id,
            creatorId: new mongoose.Types.ObjectId(userId),
            ownerId: new mongoose.Types.ObjectId(
                taskOwnerId
            ),

            assignees: taskAssignees.map(
                (id: string) =>
                    new mongoose.Types.ObjectId(id)
            ),
            parentId: parentTask?._id,
            overDue: false,
        })

        await task.save()

        try {
            await ActivityLog.create({
                userId: new mongoose.Types.ObjectId(userId),
                projectId: project._id,
                entityType: "Task",
                entityId: task._id,
                action: ActivityAction.CREATE_TASK,
                newValue: {
                    code: task.code,
                    title: task.title,
                    status: task.status,
                    priority: task.priority,
                    ownerId: task.ownerId,
                    assignees: task.assignees,
                },
            })
        } catch {
            // ignore audit log errors
        }

        return NextResponse.json(task)
    } catch {
        return NextResponse.json({ message: "Tạo task thất bại" }, { status: 500 })
    }
}
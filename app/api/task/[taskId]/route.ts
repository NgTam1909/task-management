//Cập nhật task
import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import dbConnect from "@/lib/db"
import Task from "@/models/task.model"
import Project, { IProjectMember} from "@/models/project.model"
import {ProjectRole} from "@/types/project";
import { updateTaskSchema } from "@/lib/validations/task.validation"
import ActivityLog, { ActivityAction } from "@/models/activityLog.model"
import {getUserIdFromRequest} from "@/lib/jwt";
import {getTaskOverDue} from "@/lib/overDue";
import {TaskStatus} from "@/types/task";
//xử lý sub-task và 1 vài action của hệ thống task
function toObjectId(id: string) {
    return new mongoose.Types.ObjectId(id)
}

function normalizeValue(value: unknown): unknown {
    if (value instanceof Date) return value.toISOString()
    if (value instanceof mongoose.Types.ObjectId) return value.toString()
    if (Array.isArray(value)) return value.map((item) => normalizeValue(item))
    return value
}

const allowedStatusTransitions: Record<TaskStatus, TaskStatus[]> = {
    [TaskStatus.BACKLOG]: [TaskStatus.TODO, TaskStatus.CANCELLED],
    [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS, TaskStatus.DONE, TaskStatus.CANCELLED],
    [TaskStatus.IN_PROGRESS]: [TaskStatus.PENDING_REVIEW, TaskStatus.CANCELLED],
    [TaskStatus.PENDING_REVIEW]: [TaskStatus.TODO, TaskStatus.DONE, TaskStatus.CANCELLED],
    [TaskStatus.DONE]: [TaskStatus.TODO],
    [TaskStatus.CANCELLED]: [TaskStatus.TODO],
}

function isValidStatusTransition(current: TaskStatus, next: TaskStatus) {
    if (current === next) return true
    return allowedStatusTransitions[current]?.includes(next) ?? false
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const userId = await getUserIdFromRequest(req)
        if (!userId) {
            return NextResponse.json({message: "Unauthorized"}, {status: 401})
        }

        const {taskId} = await params
        if (!taskId) {
            return NextResponse.json({message: "Thiếu taskId"}, {status: 400})
        }

        const body = await req.json()
        const parsed = updateTaskSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                {message: "Dữ liệu không hợp lệ", errors: parsed.error.flatten()},
                {status: 400}
            )
        }

        await dbConnect()

        const task = await Task.findById(taskId)
        if (!task) {
            return NextResponse.json({message: "Không tìm thấy task"}, {status: 404})
        }
        const data = parsed.data
        if (task.status === TaskStatus.DONE) {
            const onlyStatusUpdate =
                data.status !== undefined &&
                Object.keys(data).every(
                    (key) => key === "status"
                )

            if (!onlyStatusUpdate) {
                return NextResponse.json(
                    {
                        message:
                            "Task đã hoàn thành, không thể chỉnh sửa nội dung."
                    },
                    { status: 400 }
                )
            }
        }
        const project = await Project.findById(task.projectId)
        if (!project) {
            return NextResponse.json({message: "Không tìm thấy dự án"}, {status: 404})
        }

        let currentRole: ProjectRole | null
        if (project.owner?.userId?.toString() === userId) {
            currentRole = project.owner.role
        } else {
            const member = project.members.find((m: IProjectMember) => m.userId?.toString() === userId)
            currentRole = member?.role ?? null
        }

        if (!currentRole) {
            return NextResponse.json({message: "Forbidden"}, {status: 403})
        }
        // Member chỉ được thao tác task của mình
        if (currentRole === ProjectRole.MEMBER) {
            const isCreator =
                task.creatorId?.toString() === userId

            const isAssignee =
                task.assignees?.some(
                    (id: mongoose.Types.ObjectId) =>
                        id.toString() === userId
                ) ?? false

            if (!isCreator && !isAssignee) {
                return NextResponse.json(
                    {
                        message:
                            "Bạn chỉ được thao tác với công việc do mình tạo hoặc được giao."
                    },
                    { status: 403 }
                )
            }
        }
// Ràng buộc nhiệm vụ con: nếu nhiệm vụ cha bị hủy, các nhiệm vụ con cũng phải bị hủy.
        if (task.parentId && data.status !== undefined) {
            const parent = await Task.findById(task.parentId).select("status").lean()
            if (parent?.status === TaskStatus.CANCELLED && data.status !== TaskStatus.CANCELLED) {
                return NextResponse.json(
                    {message: "Task cha đã cancelled, không thể đổi trạng thái task con"},
                    {status: 400}
                )
            }
        }
//Giao việc

        let taskOwnerId: string | null = null
        let taskAssignees: string[] | null = null

        if (data.assignees !== undefined) {

            // chỉ cho đổi assignee ở backlog hoặc to-do
            if (
                ![
                    TaskStatus.BACKLOG,
                    TaskStatus.TODO,
                ].includes(task.status)
            ) {
                return NextResponse.json(
                    {
                        message:
                            "Chỉ được thay đổi người thực hiện khi task ở Backlog hoặc Todo",
                    },
                    { status: 400 }
                )
            }

            // MEMBER
            if (currentRole === ProjectRole.MEMBER) {
                return NextResponse.json(
                    {
                        message:
                            "Member không có quyền thay đổi người thực hiện",
                    },
                    { status: 403 }
                )
            }

            // LEADER
            if (currentRole === ProjectRole.LEADER) {

                // leader chỉ được giao task mình chịu trách nhiệm
                if (task.ownerId.toString() !== userId) {
                    return NextResponse.json(
                        {
                            message:
                                "Bạn không phải người chịu trách nhiệm task này",
                        },
                        { status: 403 }
                    )
                }

                const memberIds = project.members
                    .filter(
                        (m: IProjectMember) =>
                            m.role === ProjectRole.MEMBER
                    )
                    .map(
                        (m: IProjectMember) =>
                            m.userId.toString()
                    )

                const invalidAssignees =
                    data.assignees.filter(
                        (id) => !memberIds.includes(id)
                    )

                if (invalidAssignees.length > 0) {
                    return NextResponse.json(
                        {
                            message:
                                "Leader chỉ được giao việc cho Member",
                        },
                        { status: 403 }
                    )
                }

                taskOwnerId =
                    task.ownerId.toString()

                taskAssignees =
                    data.assignees
            }

            // ADMIN
            else if (currentRole === ProjectRole.ADMIN) {

                if (data.assignees.length === 0) {
                    return NextResponse.json(
                        {
                            message:
                                "Phải chọn người thực hiện",
                        },
                        { status: 400 }
                    )
                }

                taskOwnerId =
                    data.assignees[0]

                taskAssignees =
                    [data.assignees[0]]
            }
        }
        //Cập nhật
        const updateData: Record<string, unknown> = {}
        if (data.title !== undefined) updateData.title = data.title
        if (data.description !== undefined) updateData.description = data.description
        if (data.status !== undefined) updateData.status = data.status
        if (data.priority !== undefined) updateData.priority = data.priority
        if (data.labels !== undefined) updateData.labels = data.labels
        if (data.estimate !== undefined) updateData.estimate = data.estimate
        if (taskAssignees !== null) {

            updateData.assignees =
                taskAssignees.map((id) =>
                    toObjectId(id)
                )

            updateData.ownerId =
                toObjectId(taskOwnerId!)
        }
        if (data.startDate !== undefined) {

            updateData.startDate =

                data.startDate && data.startDate.trim().length > 0

                    ? new Date(`${data.startDate}T00:00:00`)

                    : null

        }
        if (data.status !== undefined) {
            const currentStatus = task.status as TaskStatus;
            const nextStatus = data.status as TaskStatus;
            if (!isValidStatusTransition(currentStatus, nextStatus)) {
                return NextResponse.json({ message: "Quy trình chuyển trạng thái không hợp lệ" }, { status: 400 });
            }
            // CHẶN: Chuyển từ Backlog sang To-do nhưng Task đã quá hạn
            if (currentStatus === TaskStatus.BACKLOG && nextStatus === TaskStatus.TODO) {
                const { isOverdue } = getTaskOverDue(task); // Sử dụng hàm helper
                if (isOverdue) {
                    return NextResponse.json(
                        { message: "Công việc đã quá hạn ở Backlog. "+
                                "Hãy cập nhật ngày hết hạn mới trước giao việc. "+
                                 "Hoặc chuyển về Cancelled để hủy bỏ"
                        },
                        { status: 400 }
                    );
                }
            }

            // PHÂN QUYỀN: Chuyển khỏi Pending Review (Admin/Leader/Creator)
            if (currentStatus === TaskStatus.PENDING_REVIEW && nextStatus !== TaskStatus.PENDING_REVIEW) {
                const isAdminOrLeader = [ProjectRole.ADMIN, ProjectRole.LEADER].includes(currentRole as any);
                const isCreator = task.creatorId?.toString() === userId;

                if (!isAdminOrLeader && !isCreator) {
                    return NextResponse.json(
                        { message: "Bạn không có quyền duyệt hoặc trả lại công việc này." },
                        { status: 403 }
                    );
                }
            }

            // Cập nhật các mốc thời gian (startedAt)
            if (currentStatus !== TaskStatus.IN_PROGRESS &&
                nextStatus === TaskStatus.IN_PROGRESS
            ) updateData.startedAt = new Date();
            if (nextStatus !== TaskStatus.IN_PROGRESS && task.startedAt) updateData.startedAt = null;

            // Cập nhật các mốc thời gian (completedAt)
            if (currentStatus !== TaskStatus.DONE &&
                nextStatus === TaskStatus.DONE
            ) updateData.completedAt = new Date();
            if ( currentStatus === TaskStatus.DONE && task.completedAt)updateData.completedAt = null;

            updateData.status = nextStatus;
        }
            if (data.dueDate !== undefined) {
                updateData.dueDate =
                    data.dueDate && data.dueDate.trim().length > 0
                        ? new Date(`${data.dueDate}T00:00:00`)
                        : null
                updateData.overDue = false
            }

            const oldValue: Record<string, unknown> = {}
            const newValue: Record<string, unknown> = {}

            for (const [key, rawNewValue] of Object.entries(updateData)) {
                let oldFieldValue: unknown = (task as unknown as Record<string, unknown>)[key]
                let newFieldValue: unknown = rawNewValue

                if (key === "assignees") {
                    oldFieldValue = Array.isArray(task.assignees)
                        ? task.assignees.map((id) => id.toString())
                        : []
                    newFieldValue = Array.isArray(rawNewValue)
                        ? (rawNewValue as mongoose.Types.ObjectId[]).map((id) => id.toString())
                        : []
                }
                if (key === "ownerId") {

                    oldFieldValue =
                        task.ownerId?.toString()

                    newFieldValue =
                        (
                            rawNewValue as mongoose.Types.ObjectId
                        ).toString()
                }

                const normalizedOld = normalizeValue(oldFieldValue)
                const normalizedNew = normalizeValue(newFieldValue)

                if (JSON.stringify(normalizedOld) !== JSON.stringify(normalizedNew)) {
                    oldValue[key] = normalizedOld
                    newValue[key] = normalizedNew
                }
            }

            await Task.updateOne({_id: task._id}, {$set: updateData})

            try {
                // Snapshot overdue một lần duy nhất
                const {isOverdue} = getTaskOverDue(task)

                if (isOverdue && !task.overDue) {
                    await Task.updateOne(
                        {_id: task._id},
                        {
                            $set: {
                                overDue: true,
                            },
                        }
                    )

                    await ActivityLog.create({
                        userId: new mongoose.Types.ObjectId(userId),
                        projectId: project._id,
                        entityType: "Task",
                        entityId: task._id,
                        action: ActivityAction.TASK_OVERDUE,
                        metadata: {
                            dueDate: task.dueDate,
                            source: "system",
                        },
                    })
                }

                // Audit các action do user thực hiện
                if (Object.keys(newValue).length > 0) {
                    let action = ActivityAction.UPDATE_TASK

                    const changedKeys = Object.keys(newValue)

                    const isStatusOnly =
                        changedKeys.length === 1 &&
                        newValue.status !== undefined

                    const isDueDateOnly =
                        changedKeys.length === 1 &&
                        newValue.dueDate !== undefined

                    if (isStatusOnly) {
                        const nextStatus = newValue.status as TaskStatus

                        if (nextStatus === TaskStatus.DONE) {
                            action = ActivityAction.TASK_COMPLETED
                        } else if (nextStatus === TaskStatus.CANCELLED) {
                            action = ActivityAction.TASK_CANCELLED
                        } else {
                            action = ActivityAction.UPDATE_TASK_STATUS
                        }
                    } else if (isDueDateOnly) {
                        action = ActivityAction.TASK_DEADLINE_EXTENDED
                    }

                    await ActivityLog.create({
                        userId: new mongoose.Types.ObjectId(userId),
                        projectId: project._id,
                        entityType: "Task",
                        entityId: task._id,
                        action,
                        oldValue,
                        newValue,
                    })
                }
            } catch {
                // ignore audit log errors
            }

            return NextResponse.json({success: true})
        }
    catch
        {
            return NextResponse.json({message: "Cập nhật task thất bại"}, {status: 500})
        }
}


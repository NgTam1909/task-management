import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import ActivityLog from "@/models/activityLog.model"
import Project from "@/models/project.model"
import Task from "@/models/task.model"
import User from "@/models/user.model"
import { PopulatedUser } from "@/types/user"
import {getUserIdFromRequest} from "@/lib/jwt";

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function buildMentionMatchers(parts: { fullName: string; email: string }) {
    const email = parts.email.trim().toLowerCase()
    const localPart = email.split("@")[0]?.trim().toLowerCase()
    const fullName = parts.fullName.trim().toLowerCase()

    return [email, localPart, fullName]
        .filter((value): value is string => !!value)
        .map((value) => new RegExp(`(^|\\s)@${escapeRegex(value)}(?=\\s|$|[,.!?])`, "i"))
}

function formatUser(userDoc: PopulatedUser | null) {
    if (!userDoc || typeof userDoc !== "object" || !("_id" in userDoc)) return null

    return {
        id: userDoc._id?.toString?.() ?? "",
        name: `${userDoc.lastName ?? ""} ${userDoc.firstName ?? ""}`.trim(),
        email: userDoc.email ?? null,
    }
}

function getTaskTitleFromLog(log: {
    oldValue?: unknown
    newValue?: unknown
}) {
    const oldValue = (log.oldValue ?? {}) as Record<string, unknown>
    const newValue = (log.newValue ?? {}) as Record<string, unknown>

    if (typeof newValue.title === "string" && newValue.title.trim().length > 0) {
        return newValue.title
    }

    if (typeof oldValue.title === "string" && oldValue.title.trim().length > 0) {
        return oldValue.title
    }

    return null
}

function isTaskAssignmentNotification(
    log: {
        entityType: string
        action: string
        newValue?: unknown
        oldValue?: unknown
        metadata?: unknown
    },
    userId: string
) {
    if (log.entityType !== "Task") return false
    if (log.action !== "CREATE_TASK" && log.action !== "UPDATE_TASK") return false

    const oldValue = (log.oldValue ?? {}) as Record<string, unknown>
    const newValue = (log.newValue ?? {}) as Record<string, unknown>
    const previousAssignees = Array.isArray(oldValue.assignees)
        ? oldValue.assignees.map((value) => String(value))
        : []
    const nextAssignees = Array.isArray(newValue.assignees)
        ? newValue.assignees.map((value) => String(value))
        : []

    if (!nextAssignees.includes(userId)) return false
    if (log.action === "CREATE_TASK") return true

    return !previousAssignees.includes(userId)
}

function isProjectUserStatusNotification(
    log: { entityType: string; action: string; metadata?: unknown },
    userId: string
) {
    if (log.entityType !== "Project" && log.entityType !== "Invite") return false

    // Only keep project notifications that affect the current user.
    if (
        log.action !== "INVITE_MEMBER" &&
        log.action !== "JOIN_PROJECT" &&
        log.action !== "REMOVE_MEMBER"
    ) {
        return false
    }

    const metadata = (log.metadata ?? {}) as Record<string, unknown>
    const affected = Array.isArray(metadata.affectedUserIds)
        ? metadata.affectedUserIds.map((value) => String(value))
        : []

    return affected.includes(userId)
}

export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req)
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const [user, projects] = await Promise.all([
            User.findById(userId).select("firstName lastName email").lean(),
            Project.find({
                isActive: true,
                $or: [{ "owner.userId": userId }, { "members.userId": userId }],
            })
                .select("_id title projectId")
                .lean(),
        ])

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 })
        }

        const projectIds = projects.map((project) => project._id)
        const projectMap = new Map(
            projects.map((project) => [
                project._id.toString(),
                {
                    id: project.projectId,
                    title: project.title,
                },
            ])
        )

        const logs = await ActivityLog.find({
            $or: [
                ...(projectIds.length > 0 ? [{ projectId: { $in: projectIds } }] : []),
                { "metadata.affectedUserIds": userId },
            ],
        })
            .populate("userId", "firstName lastName email")
            .sort({ createdAt: -1 })
            .limit(50)
            .lean()

        const mentionMatchers = buildMentionMatchers({
            fullName: `${user.lastName ?? ""} ${user.firstName ?? ""}`.trim(),
            email: user.email ?? "",
        })

        const mentionTasks =
            projectIds.length > 0 && mentionMatchers.length > 0
                ? await Task.find({
                      projectId: { $in: projectIds },
                      comments: { $elemMatch: { content: { $regex: /@/ } } },
                  })
                      .select("_id title projectId comments")
                      .populate("comments.userId", "firstName lastName email")
                      .lean()
                : []

        const mentionNotifications = mentionTasks
            .flatMap((task) => {
                const project = projectMap.get(task.projectId.toString())

                return (Array.isArray(task.comments) ? task.comments : [])
                    .filter((comment) =>
                        mentionMatchers.some((matcher) => matcher.test(comment.content ?? ""))
                    )
                    .map((comment) => ({
                        id: `mention-${task._id.toString()}-${comment._id?.toString?.() ?? comment.createdAt}`,
                        type: "mention" as const,
                        action: "MENTION",
                        entityType: "Task" as const,
                        entityId: task._id.toString(),
                        createdAt:
                            comment.createdAt instanceof Date
                                ? comment.createdAt.toISOString()
                                : new Date(comment.createdAt).toISOString(),
                        oldValue: null,
                        newValue: null,
                        metadata: {
                            projectId: project?.id ?? null,
                            projectTitle: project?.title ?? null,
                            taskTitle: task.title,
                            content: comment.content,
                        },
                        user: formatUser(comment.userId as PopulatedUser | null),
                    }))
            })
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )

        const formattedLogs = logs
            .filter((log) => {
                if (log.entityType === "Task") {
                    return isTaskAssignmentNotification(log, userId)
                }
                return isProjectUserStatusNotification(log, userId)
            })
            .map((log) => {
            const userDoc = log.userId as PopulatedUser | null
            const metadata = (log.metadata ?? {}) as Record<string, unknown>
            const project = projectMap.get(log.projectId?.toString?.() ?? "")

            return {
                id: log._id.toString(),
                type: "activity" as const,
                action: log.action,
                entityType: log.entityType,
                entityId: log.entityId?.toString() ?? null,
                createdAt:
                    log.createdAt instanceof Date
                        ? log.createdAt.toISOString()
                        : new Date(log.createdAt).toISOString(),
                oldValue: log.oldValue ?? null,
                newValue: log.newValue ?? null,
                metadata: {
                    ...metadata,
                    projectId:
                        project?.id ??
                        (typeof metadata.projectId === "string" ? metadata.projectId : null),
                    projectTitle:
                        project?.title ??
                        (typeof metadata.projectTitle === "string"
                            ? metadata.projectTitle
                            : null),
                    taskTitle:
                        typeof metadata.taskTitle === "string"
                            ? metadata.taskTitle
                            : getTaskTitleFromLog(log),
                },
                user: formatUser(userDoc),
            }
            })

        const notifications = [...formattedLogs, ...mentionNotifications]
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            .slice(0, 30)

        return NextResponse.json({ notifications })
    } catch {
        return NextResponse.json(
            { message: "Không thể lấy thông báo" },
            { status: 500 }
        )
    }
}

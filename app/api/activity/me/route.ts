import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import ActivityLog, { ActivityAction } from "@/models/activityLog.model"
import Project from "@/models/project.model"
import User from "@/models/user.model"
import { PopulatedUser } from "@/types/user"
import {getUserIdFromRequest} from "@/lib/jwt";

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



export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req)
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        await dbConnect()

        // 1. Lấy thông tin user và danh sách project gọn nhất có thể
        const [user, projects] = await Promise.all([
            User.findById(userId).select("firstName lastName email").lean(),
            Project.find({
                isActive: true,
                $or: [{ "owner.userId": userId }, { "members.userId": userId }],
            }).select("_id title projectId").lean(),
        ])

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 })
        }

        const projectIds = projects.map((project) => project._id)
        const projectMap = new Map(
            projects.map((p) => [p._id.toString(), { id: p.projectId, title: p.title }])
        )

        const logsQuery: any = {
            $or: [
                {
                    projectId: { $in: projectIds },
                    entityType: "Task",
                    action: {
                        $in: [
                            ActivityAction.CREATE_TASK,
                            ActivityAction.UPDATE_TASK,
                        ],
                    },
                    $or: [
                        { "newValue.assignees": userId },
                        { "oldValue.assignees": userId },
                    ],
                },

                {
                    entityType: { $in: ["Project", "Invite"] },
                    action: {
                        $in: [
                            ActivityAction.INVITE_MEMBER,
                            ActivityAction.JOIN_PROJECT,
                            ActivityAction.REMOVE_MEMBER,
                        ],
                    },
                    "metadata.affectedUserIds": userId,
                },

                {
                    action: ActivityAction.MENTION,
                    "metadata.affectedUserIds": userId,
                },
            ],
        }

        // Thực hiện truy vấn log
        const logs = await ActivityLog.find(logsQuery)
            .select("_id userId projectId action entityType entityId createdAt oldValue newValue metadata")
            .populate("userId", "firstName lastName email")
            .sort({ createdAt: -1 })
            .limit(40)
            .lean();

        // 2. Sửa lỗi TS2339 bằng cách ép kiểu dữ liệu log khi map dữ liệu
        const formattedLogs = logs.map((log: any) => { // Đổi sang kiểu any ở vòng lặp để dễ truy cập property lẻ
            const userDoc = log.userId as PopulatedUser | null;
            const metadata = (log.metadata ?? {}) as Record<string, unknown>;
            const project = projectMap.get(log.projectId?.toString?.() ?? "");

            // Xử lý kiểm tra assignees một cách an toàn với TypeScript
            if (
                log.entityType === "Task" &&
                log.action !== ActivityAction.MENTION
            ) {
                const newValueObj = (log.newValue ?? {}) as Record<string, unknown>

                const nextAssignees = Array.isArray(newValueObj.assignees)
                    ? newValueObj.assignees.map(String)
                    : []

                if (
                    log.action === ActivityAction.CREATE_TASK &&
                    !nextAssignees.includes(userId)
                ) {
                    return null
                }
            }

            return {
                id: log._id.toString(),
                type: "activity" as const,
                action: log.action,
                entityType: log.entityType,
                entityId: log.entityId?.toString() ?? null,
                createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : new Date(log.createdAt).toISOString(),
                oldValue: log.oldValue ?? null,
                newValue: log.newValue ?? null,
                metadata: {
                    ...metadata,
                    projectId: project?.id ?? metadata.projectId ?? null,
                    projectTitle: project?.title ?? metadata.projectTitle ?? null,
                    taskTitle: metadata.taskTitle ?? getTaskTitleFromLog(log),
                },
                user: formatUser(userDoc),
            };
        }).filter(
            (
                item
            ): item is NonNullable<typeof item> =>
                item !== null
        );

        const notifications = formattedLogs
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
            )
            .slice(0, 30)

        return NextResponse.json({ notifications })
    } catch (error) {
        return NextResponse.json({ message: "Không thể lấy thông báo" }, { status: 500 })
    }
}
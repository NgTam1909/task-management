"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { NotificationItem } from "@/types/notification"
import { ACTION_LABELS, FIELD_LABELS } from "@/constants/notification"

type Props = {
    notifications: NotificationItem[]
    logsLoading: boolean
    logsError: string | null
}

export default function NotificationList({
                                             notifications,
                                             logsLoading,
                                             logsError,
                                         }: Props) {
    const router = useRouter()

    const formatLogTime = (value: string) => {
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return value
        return date.toLocaleString("vi-VN")
    }

    const formatFieldValue = (key: string, value: unknown) => {
        if (value === null || value === undefined || value === "") return "trống"
        if (Array.isArray(value)) {
            return value.map((item) => String(item)).join(", ")
        }
        if (typeof value === "string") {
            if (key === "startDate" || key === "dueDate") {
                const date = new Date(value)
                if (!Number.isNaN(date.getTime())) {
                    return date.toLocaleDateString("vi-VN")
                }
            }
            return value
        }
        if (typeof value === "number" || typeof value === "boolean") {
            return String(value)
        }
        return JSON.stringify(value)
    }

    const getLogChanges = (notification: NotificationItem) => {
        const oldValue = (notification.oldValue ?? {}) as Record<string, unknown>
        const newValue = (notification.newValue ?? {}) as Record<string, unknown>
        const keys = Array.from(new Set([...Object.keys(oldValue), ...Object.keys(newValue)]))

        return keys
            .filter((key) => JSON.stringify(oldValue[key]) !== JSON.stringify(newValue[key]))
            .map((key) => ({
                key,
                label: FIELD_LABELS[key] ?? key,
                from: formatFieldValue(key, oldValue[key]),
                to: formatFieldValue(key, newValue[key]),
            }))
    }

    const getMetadata = (notification: NotificationItem) =>
        (notification.metadata ?? {}) as Record<string, unknown>

    const getProjectTitle = (notification: NotificationItem) => {
        const projectTitle = getMetadata(notification).projectTitle
        return typeof projectTitle === "string" ? projectTitle : null
    }

    const getNotificationDescription = (notification: NotificationItem) => {
        const metadata = getMetadata(notification)

        if (notification.action === "DELETE_PROJECT") {
            return "Admin đã xóa dự án này."
        }

        if (notification.action === "REMOVE_MEMBER") {
            return "Bạn đã bị xóa khỏi dự án."
        }

        if (notification.action === "INVITE_MEMBER") {
            return "Bạn nhận được lời mời vào dự án."
        }

        if (notification.action === "JOIN_PROJECT") {
            return "Bạn đã được thêm vào dự án."
        }

        if (notification.action === "CHANGE_ROLE") {
            const nextRole = formatFieldValue(
                "role",
                (notification.newValue as Record<string, unknown> | null)?.role
            )
            return `Vai trò của bạn đã được cập nhật thành ${nextRole}.`
        }

        if (notification.action === "MENTION") {
            const taskTitle =
                typeof metadata.taskTitle === "string" ? metadata.taskTitle : "một công việc"
            return `Bạn được nhắc tới trong ${taskTitle}.`
        }

        if (
            notification.entityType === "Task" &&
            (notification.action === "CREATE_TASK" ||
                notification.action === "UPDATE_TASK")
        ) {
            const taskTitle =
                typeof metadata.taskTitle === "string" ? metadata.taskTitle : "một công việc"
            return `Bạn được gán vào ${taskTitle}.`
        }

        return null
    }

    const handleNotificationClick = (notification: NotificationItem) => {
        const metadata = getMetadata(notification)
        const projectId =
            typeof metadata.projectId === "string" ? metadata.projectId : null
        const taskId = notification.entityType === "Task" ? notification.entityId : null

        if (projectId && taskId) {
            router.push(`/project/${projectId}/tasks?taskId=${taskId}`)
            return
        }

        if (projectId && notification.action === "JOIN_PROJECT") {
            router.push(`/project/${projectId}/tasks`)
        }
    }

    return (
        <>
            {logsLoading && (
                <div className="px-2 py-2 text-xs text-muted-foreground">
                    Đang tải thông báo...
                </div>
            )}

            {!logsLoading && logsError && (
                <div className="px-2 py-2 text-xs text-red-500">
                    {logsError}
                </div>
            )}

            {!logsLoading && !logsError && notifications.length === 0 && (
                <div className="px-2 py-2 text-xs text-muted-foreground">
                    Chào mừng bạn đã đến đây. Hãy hoạt động nhiều hơn để có thêm thông báo
                </div>
            )}

            {!logsLoading && !logsError && notifications.length > 0 && (
                <div className="max-h-80 overflow-auto">
                    {notifications.map((notification) => {
                        const changes = getLogChanges(notification)
                        const metadata = getMetadata(notification)
                        const projectTitle = getProjectTitle(notification)
                        const summary = getNotificationDescription(notification)

                        return (
                            <div
                                key={notification.id}
                                className={cn(
                                    "rounded-md px-6 py-2 text-sm hover:bg-accent",
                                    notification.entityType === "Task" &&
                                    notification.entityId
                                        ? "cursor-pointer"
                                        : ""
                                )}
                                onClick={() =>
                                    handleNotificationClick(notification)
                                }
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="font-medium">
                                        {ACTION_LABELS[notification.action] ??
                                            notification.action}
                                    </div>

                                    {projectTitle && (
                                        <div className="text-[11px] text-muted-foreground">
                                            {projectTitle}
                                        </div>
                                    )}
                                </div>

                                <div className="text-xs text-muted-foreground">
                                    {(notification.user?.name ?? "Hệ thống") +
                                        " - " +
                                        formatLogTime(notification.createdAt)}
                                </div>

                                {summary && (
                                    <div className="mt-2 text-xs text-foreground/80">
                                        {summary}
                                    </div>
                                )}

                                {notification.action === "MENTION" &&
                                    typeof metadata.content === "string" && (
                                        <div className="mt-2 line-clamp-3 text-xs text-muted-foreground">
                                            {metadata.content}
                                        </div>
                                    )}

                                {changes.length > 0 && (
                                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                        {changes.map((change) => (
                                            <div
                                                key={`${notification.id}-${change.key}`}
                                            >
                                                {/*<span className="font-medium text-foreground/80">*/}
                                                {/*    {change.label}:*/}
                                                {/*</span>{" "}*/}
                                                {/*{change.from}{" "}*/}
                                                {/*<ArrowRight*/}
                                                {/*    size={12}*/}
                                                {/*    className="inline text-muted-foreground"*/}
                                                {/*/>{" "}*/}
                                                {/*{change.to}*/}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </>
    )
}
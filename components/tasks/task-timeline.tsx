"use client"

import { Button } from "@/components/ui/button"
import {
    taskDetailActionLabels,
    taskDetailFieldLabels,
} from "@/constants/task-detail"
import { MessageSquareReply } from "lucide-react"
import {AssigneeOption, TaskComment, TimelineItem} from "@/types/task-detail";

type TimelineListProps = {
    timelineItems: TimelineItem[]
    comments: TaskComment[]
    auditLoading: boolean
    commentsLoading: boolean
    auditError: string | null
    setReplyToAction: (id: string | null) => void
    availableUsers: AssigneeOption[]
}
export function TimelineList({
                                 timelineItems,
                                 comments,
                                 auditLoading,
                                 commentsLoading,
                                 auditError,
                                 setReplyToAction,
                                 availableUsers,
                             }: TimelineListProps) {

    // Copy các hàm format vào đây
    const formatLogTime = (value: string) => {
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) {
            return value
        }
        const datePart = date.toLocaleDateString("vi-VN")
        const timePart = date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        })
        return `${datePart} - ${timePart}`
    }

    const formatLogValue = (key: string, value: unknown) => {
        if (value === null || value === undefined || value === "") return "Trống"

        if (Array.isArray(value)) {
            if (key === "assignees") {
                return (
                    value
                        .map((assigneeId) => {
                            const user = availableUsers.find(
                                (item) => item.id === String(assigneeId)
                            )
                            return user?.name ?? String(assigneeId)
                        })
                        .join(", ") || "Trống"
                )
            }
            return value.map((item) => String(item)).join(", ")
        }

        if (typeof value === "string") {
            const date = new Date(value)
            if (
                !Number.isNaN(date.getTime()) &&
                (key === "startDate" || key === "dueDate" || /^\d{4}-\d{2}-\d{2}T/.test(value))
            ) {
                return date.toLocaleDateString("vi-VN")
            }
        }

        return String(value)
    }

    const getLogChanges = (log: any) => {
        const oldValue = (log.oldValue ?? {}) as Record<string, unknown>
        const newValue = (log.newValue ?? {}) as Record<string, unknown>
        const keys = Array.from(
            new Set([
                ...Object.keys(oldValue),
                ...Object.keys(newValue),
            ])
        )
        return keys
            .filter(
                (key) =>
                    JSON.stringify(oldValue[key]) !==
                    JSON.stringify(newValue[key])
            )
            .map((key) => ({
                key,
                label: taskDetailFieldLabels[key] ?? key,
                from: formatLogValue(key, oldValue[key]),
                to: formatLogValue(key, newValue[key]),
            }))
    }

    const scrollToComment = (commentId: string) => {
        const element = document.getElementById(`comment-${commentId}`)
        if (!element) return
        element.scrollIntoView({
            behavior: "smooth",
            block: "center",
        })
        element.classList.add("ring-2", "ring-primary")
        setTimeout(() => {
            element.classList.remove("ring-2", "ring-primary")
        }, 2000)
    }

    return (
        <>
            {!auditLoading && auditError && (
                <p className="text-sm text-red-500">{auditError}</p>
            )}

            {!auditLoading && !commentsLoading && !auditError && timelineItems.length > 0 && (
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {timelineItems.map((item) => {
                        if (item.kind === "comment") {
                            const parentComment = comments.find(
                                c => c.id === item.comment.parentCommentId
                            )
                            return (
                                <div
                                    id={`comment-${item.comment.id}`}
                                    key={item.id}
                                    className="group rounded-md border p-2 w-max"
                                >
                                    {parentComment && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                scrollToComment(parentComment.id)
                                            }
                                            className="mt-2 mb-2 block w-full rounded bg-muted px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted/80"
                                        >
                                            ↳ "
                                            {parentComment.content.length > 80
                                                ? parentComment.content.slice(0, 80) + "..."
                                                : parentComment.content}
                                            "
                                        </button>
                                    )}
                                    <div className="flex justify-between">
                                        <div className="text-sm font-medium">Bình luận</div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="invisible h-7 px-2 group-hover:visible"
                                            onClick={() =>
                                                setReplyToAction(item.comment.id)
                                            }
                                        >
                                            <MessageSquareReply />
                                        </Button>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {(item.comment.user?.name ?? "Hệ thống") +
                                            "  " +
                                            formatLogTime(item.comment.createdAt)}
                                    </div>
                                    <div className="text-sm">
                                        {item.comment.content}
                                    </div>
                                </div>
                            )
                        }
                        const changes = getLogChanges(item.log)
                        return (
                            <div key={item.id} className="rounded-md border p-2">
                                <div className="text-sm font-medium">
                                    {taskDetailActionLabels[item.log.action] ?? item.log.action}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {(item.log.user?.name ?? "Hệ thống") +
                                        "  " +
                                        formatLogTime(item.log.createdAt)}
                                </div>
                                {changes.length > 0 && (
                                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                        {changes.map((change) => (
                                            <div key={`${item.log.id}-${change.key}`}>
                                                <span className="font-medium text-foreground/80">
                                                    {change.label}:
                                                </span>{" "}
                                                {change.from} → {change.to}
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
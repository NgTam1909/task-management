"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    taskDetailActionLabels,
    taskDetailFieldLabels,
} from "@/constants/task-detail"

import { useTaskDetail } from "@/hooks/useTaskDetail"

import { ActivityLog } from "@/types/activity-log"
import { Task } from "@/types/task"
import {useState} from "react";
type TaskDetailProps = {
    task: Task
}
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
export function TaskComment({ task }: TaskDetailProps) {
    const {
        availableUsers,
        commentValue,
        mentionUsers,
        mentionedUsers,
        setMentionedUsers,

        timelineItems,
        auditLoading,
        commentsLoading,
        auditError,
        commentsError,
        setCommentValue,
        handleCommentSubmit,
    } = useTaskDetail(task)
    const [showMentionList, setShowMentionList] = useState(false)
    const [mentionKeyword, setMentionKeyword] = useState("")
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
                (
                    key === "startDate" ||
                    key === "dueDate" ||
                    /^\d{4}-\d{2}-\d{2}T/.test(value)
                )
            ) {
                return date.toLocaleDateString("vi-VN")
            }
        }

        return String(value)
    }
    const getLogChanges = (log: ActivityLog) => {
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
    const filteredUsers = mentionUsers.filter(
        (user) =>
            !mentionedUsers.some((m) => m.id === user.id) &&
            user.name.toLowerCase().includes(
                mentionKeyword.toLowerCase()
            )
    )
    return (
        <div className="space-y-4">
                <div className="space-y-2">
                        <div className="relative flex items-center gap-2">
                            <Input
                                placeholder="Bình luận"
                                value={commentValue}
                                onChange={(e) => {
                                    const value = e.target.value
                                    setCommentValue(value)
                                    setMentionedUsers((prev) =>
                                        prev.filter((user) =>
                                            value.includes(`${user.name}`)
                                        )
                                    )
                                    const match = value.match(/@([^\s@]*)$/)
                                    console.log("match", match)
                                    if (match) {
                                        setShowMentionList(true)
                                        setMentionKeyword(match[1])
                                    } else {
                                        setShowMentionList(false)
                                        setMentionKeyword("")
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault()
                                        void handleCommentSubmit()
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => void handleCommentSubmit()}
                                disabled={commentValue.trim().length === 0}
                            >
                                Gửi
                            </Button>
                            {showMentionList && filteredUsers.length > 0 && (
                                <div className="absolute z-50 mt-4 w-max rounded-md border bg-background shadow">
                                    {filteredUsers.map((user) => (
                                        <button
                                            key={user.id}
                                            type="button"
                                            className=" w-max px-3 py-2 text-left hover:bg-muted"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                                const newValue = commentValue.replace(
                                                    /@\w*$/,
                                                    `${user.name} `
                                                )

                                                setCommentValue(newValue)

                                                setMentionedUsers((prev) =>
                                                    prev.some((u) => u.id === user.id)
                                                        ? prev
                                                        : [
                                                            ...prev,
                                                            {
                                                                id: user.id,
                                                                name: user.name,
                                                            },
                                                        ]
                                                )

                                                setShowMentionList(false)
                                            }}
                                        >
                                            {user.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {commentsError && <p className="text-sm text-red-500">{commentsError}</p>}
                </div>
                    {!auditLoading && auditError && (
                        <p className="text-sm text-red-500">{auditError}</p>
                    )}

                    {!auditLoading && !commentsLoading && !auditError && timelineItems.length > 0 && (
                        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                            {timelineItems.map((item) => {
                                if (item.kind === "comment") {
                                    return (
                                        <div key={item.id} className="rounded-md border p-2">
                                            <div className="text-sm font-medium">Bình luận</div>
                                            <div className="text-xs text-muted-foreground">
                                                {(item.comment.user?.name ?? "Hệ thống") +
                                                    "  " +
                                                    formatLogTime(item.comment.createdAt)}
                                            </div>
                                            <div className="mt-2 text-sm">{item.comment.content}</div>
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
                                                        {change.from} → {change.to}                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
        </div>
    )}
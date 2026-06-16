"use client"

import {
    createTaskComment,
    updateTask,
} from "@/services/task.service"
import { PriorityLevel } from "@/types/task"

export function useTaskDetailHandlers(task: any, state: any) {
    const handleSelectUser = async (userId: string) => {
        const newUsers =
            state.currentUserRole === "Member"
                ? [userId]
                : state.selectedUsers.includes(userId)
                    ? state.selectedUsers.filter((id: string) => id !== userId)
                    : [...state.selectedUsers, userId]

        state.setSelectedUsers(newUsers)

        try {
            state.setSaveError(null)
            await updateTask(task.id, { assignees: newUsers })
            window.dispatchEvent(new CustomEvent("task:updated"))
            state.setIsOpen(false)
        } catch {
            state.setSelectedUsers(task.assigneeIds || [])
            state.setSaveError("Cập nhật người thực hiện thất bại")
        }
    }

    const handleTitleBlur = async () => {
        const normalizedTitle = state.titleValue.trim()
        const currentTitle = task.title ?? ""

        if (normalizedTitle === currentTitle) return

        if (!normalizedTitle) {
            state.setTitleValue(currentTitle)
            state.setSaveError("Tiêu đề không được để trống")
            return
        }

        try {
            state.setSaveError(null)
            await updateTask(task.id, { title: normalizedTitle })
            window.dispatchEvent(new CustomEvent("task:updated"))
        } catch {
            state.setTitleValue(currentTitle)
            state.setSaveError("Cập nhật tiêu đề thất bại")
        }
    }

    const handleDescriptionBlur = async () => {
        const normalizedDescription = state.descriptionValue.trim()
        const currentDescription = task.description ?? ""

        if (normalizedDescription === currentDescription) return

        try {
            state.setSaveError(null)
            await updateTask(task.id, { description: normalizedDescription })
            window.dispatchEvent(new CustomEvent("task:updated"))
        } catch {
            state.setDescriptionValue(currentDescription)
            state.setSaveError("Cập nhật mô tả thất bại")
        }
    }

    const handlePriorityChange = async (value: any) => {
        const currentPriority = task.priority ?? ""

        state.setPriorityValue(value)

        if (value === currentPriority) return

        try {
            state.setSaveError(null)

            await updateTask(task.id, {
                priority:
                    value === ""
                        ? PriorityLevel.NONE
                        : value === "high"
                            ? PriorityLevel.HIGH
                            : value === "medium"
                                ? PriorityLevel.MEDIUM
                                : PriorityLevel.LOW,
            })

            window.dispatchEvent(new CustomEvent("task:updated"))
        } catch {
            state.setPriorityValue(currentPriority)
            state.setSaveError("Cập nhật priority thất bại")
        }
    }
    const handleAssigneeBlur = async () => {

        if (
            JSON.stringify(state.selectedUsers) ===
            JSON.stringify(task.assigneeIds || [])
        ) {
            return
        }

        try {
            state.setSaveError(null)

            await updateTask(task.id, {
                assignees: state.selectedUsers,
            })

            window.dispatchEvent(
                new CustomEvent("task:updated")
            )

        } catch {

            state.setSelectedUsers(
                task.assigneeIds || []
            )

            state.setSaveError(
                "Cập nhật người thực hiện thất bại"
            )
        }
    }
    const handleStartDateChange = async (value: string) => {
        state.setStartDateValue(value)

        try {
            state.setSaveError(null)
            await updateTask(task.id, { startDate: value ?? "" })
            window.dispatchEvent(new CustomEvent("task:updated"))
        } catch {
            state.setSaveError("Cập nhật ngày bắt đầu thất bại")
        }
    }

    const handleDueDateChange = async (value: string) => {
        state.setDueDateValue(value)

        try {
            state.setSaveError(null)
            await updateTask(task.id, { dueDate: value ?? "" })
            window.dispatchEvent(new CustomEvent("task:updated"))
        } catch {
            state.setSaveError("Cập nhật ngày kết thúc thất bại")
        }
    }

    const handleEstimateBlur = async () => {
        try {
            state.setSaveError(null)

            if (state.estimateValue.trim() === "") {
                await updateTask(task.id, { estimate: null })
                window.dispatchEvent(new CustomEvent("task:updated"))
                return
            }

            const num = Number(state.estimateValue)

            if (Number.isNaN(num)) {
                state.setSaveError("Estimate không hợp lệ")
                return
            }

            await updateTask(task.id, { estimate: num })
            window.dispatchEvent(new CustomEvent("task:updated"))
        } catch {
            state.setSaveError("Cập nhật estimate thất bại")
        }
    }

    const handleCommentSubmit = async () => {
        const content = state.commentValue.trim()

        if (!content) return

        try {
            state.setCommentsError(null)
            await createTaskComment(
                task.id,
                content,
                state.mentionedUsers.map(
                    (user: {
                        id: string
                        name: string
                    }) => user.id
                ),
                state.replyTo
            )
            state.setCommentValue("")
            state.setMentionedUsers([])
            state.setReplyTo(null)

            window.dispatchEvent(new CustomEvent("task:updated"))
        } catch {
            state.setCommentsError("Không thể gửi bình luận")
        }
    }

    const timelineItems = [
        ...state.auditLogs.filter(
            (log: any) =>
                log.action !== "MENTION"
        ).map((log: any) => ({
            id: `audit-${log.id}`,
            kind: "audit",
            createdAt: log.createdAt,
            log,
        })),
        ...state.comments.map((comment: any) => ({
            id: `comment-${comment.id}`,
            kind: "comment",
            createdAt: comment.createdAt,
            comment,
        })),
    ].sort(
        (a, b) =>
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
    )

    return {
        timelineItems,
        handleSelectUser,
        handleTitleBlur,
        handleDescriptionBlur,
        handlePriorityChange,
        handleStartDateChange,
        handleDueDateChange,
        handleEstimateBlur,
        handleCommentSubmit,
    }
}
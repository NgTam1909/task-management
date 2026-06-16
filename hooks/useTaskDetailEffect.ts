"use client"

import { useEffect, useRef } from "react"
import {
    getTaskAuditLogs,
    getTaskComments,
} from "@/services/task.service"
import {getProjectMentionUsers, getTaskAssignees} from "@/services/project.service";

export function useTaskDetailEffects(task: any, state: any) {
    const loadAuditLogs = async () => {
        if (!task.id) return

        try {
            state.setAuditLoading(true)
            state.setAuditError(null)

            const data = await getTaskAuditLogs(task.id)
            state.setAuditLogs(Array.isArray(data?.logs) ? data.logs : [])
        } catch {
            state.setAuditError("Không thể tải log audit")
        } finally {
            state.setAuditLoading(false)
        }
    }

    const loadComments = async () => {
        if (!task.id) return

        try {
            state.setCommentsLoading(true)
            state.setCommentsError(null)

            const data = await getTaskComments(task.id)
            state.setComments(Array.isArray(data?.comments) ? data.comments : [])
        } catch {
            state.setCommentsError("Không thể tải bình luận")
        } finally {
            state.setCommentsLoading(false)
        }
    }

    useEffect(() => {
        if (!state.isOpen) return

        const handleClickOutside = (event: MouseEvent) => {
            if (
                state.dropdownRef.current &&
                !state.dropdownRef.current.contains(event.target as Node)
            ) {
                state.setIsOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [state.isOpen])

    const wasOpenRef = useRef(state.isOpen)

    useEffect(() => {
        if (wasOpenRef.current && !state.isOpen) {
            void state.handleAssigneeBlur?.()
        }
        wasOpenRef.current = state.isOpen
    }, [state.isOpen, state.handleAssigneeBlur])

    useEffect(() => {
        state.setSelectedUsers(task.assigneeIds || [])
        state.setTitleValue(task.title ?? "")
        state.setDescriptionValue(task.description ?? "")
        state.setPriorityValue(task.priority ?? "")
        state.setStartDateValue(task.startDateValue ?? "")
        state.setDueDateValue(task.dueDateValue ?? "")
        state.setEstimateValue(task.estimate != null ? String(task.estimate) : "")
        state.setIsEditingTitle(false)
        state.setIsEditingDescription(false)
        state.setIsEditingEstimate(false)
        state.setSaveError(null)
    }, [task])

    useEffect(() => {
        loadAuditLogs()
        loadComments()
    }, [task.id])

    useEffect(() => {
        const handleTaskUpdated = () => {
            loadAuditLogs()
            loadComments()
        }

        window.addEventListener("task:updated", handleTaskUpdated)
        return () => window.removeEventListener("task:updated", handleTaskUpdated)
    }, [task.id])

    useEffect(() => {
        if (!task.projectId) return

        let active = true

        const loadAssignees = async () => {
            try {
                const data = await getTaskAssignees(task.projectId)

                if (!active) return

                state.setAvailableUsers(
                    Array.isArray(data.assignees) ? data.assignees : []
                )

                state.setCurrentUserRole(data.currentUserRole)
            } catch {
                if (active) {
                    state.setAvailableUsers([])
                    state.setCurrentUserRole(null)
                }
            }
        }

        void loadAssignees()

        return () => {
            active = false
        }
    }, [task.projectId])
    useEffect(() => {
        if (!task.projectId) return

        let active = true

        const loadMentionUsers = async () => {
            try {
                const data = await getProjectMentionUsers(task.projectId)

                if (!active) return

                state.setMentionUsers(
                    Array.isArray(data.mentions)
                        ? data.mentions
                        : []
                )

                if (data.currentUserId) {
                    state.setCurrentUserId(data.currentUserId)
                }
            } catch {
                if (active) {
                    state.setMentionUsers([])
                }
            }
        }

        void loadMentionUsers()

        return () => {
            active = false
        }
    }, [task.projectId])
}
'use client'

import { useEffect, useState } from "react"
import { getTaskSubtasks } from "@/services/task.service"
import { TaskSubtaskItem, Task } from "@/types/task"

function mapAssigneeName(assignee: any) {
    if (typeof assignee === "string") return assignee

    const fullName = `${assignee.lastName ?? ""} ${assignee.firstName ?? ""}`.trim()
    return fullName || assignee.name || assignee.email || "User"
}

export function useTaskSubtasks(parentTask: Task) {
    const [items, setItems] = useState<TaskSubtaskItem[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const load = async () => {
        if (!parentTask.id) return

        try {
            setLoading(true)
            setError(null)

            const data = await getTaskSubtasks(parentTask.id)
            const subtasks = Array.isArray(data?.subtasks) ? data.subtasks : []

            setItems(
                subtasks.map((subtask) => ({
                    id: subtask._id,
                    status: subtask.status,
                    code: subtask.code,
                    assigneesText: Array.isArray(subtask.assignees)
                        ? subtask.assignees
                              .map((assignee) => mapAssigneeName(assignee))
                              .filter(Boolean)
                              .join(", ")
                        : "",
                }))
            )
        } catch (err: any) {
            setItems([])
            setError(err?.response?.data?.message || "Khong the tai task con")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void load()

        const handler = () => void load()
        window.addEventListener("task:updated", handler)
        window.addEventListener("task:created", handler)

        return () => {
            window.removeEventListener("task:updated", handler)
            window.removeEventListener("task:created", handler)
        }
    }, [parentTask.id])

    return {
        items,
        loading,
        error,
    }
}

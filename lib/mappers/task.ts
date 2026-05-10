import {ApiTask} from "@/types/project";
import {Task, TaskStatus} from "@/types/task";

export function toTask(item: ApiTask, projectId?: string): Task {
    const code = `TSK-${item._id.slice(-6).toUpperCase()}`
    const priority =
        item.priority === "low" ||
        item.priority === "medium" ||
        item.priority === "high"
            ? item.priority
            : undefined

    const assignees = Array.isArray(item.assignees)
        ? item.assignees.map((a) => {
            if (typeof a === "string") return a
            const fullName = `${a.lastName ?? ""} ${a.firstName ?? ""}`.trim()
            return fullName || a.name || a.email || "User"
        })
        : undefined

    return {
        id: item._id,
        projectId,
        parentId: item.parentId ?? undefined,
        code,
        title: item.title,
        status: item.status as TaskStatus,
        priority,
        description: item.description ?? undefined,
        creatorId: item.creatorId ?? undefined,
        assignees,
        labels: item.labels,
        startDate: item.startDate ?? undefined,
        dueDate: item.dueDate ?? undefined,
        estimate: item.estimate ?? undefined,
        createdAt: item.createdAt ?? undefined,
        updatedAt: item.updatedAt ?? undefined,
    }

}
export function toTaskDetail(item: ApiTask, projectId?: string): Task {
    const task = toTask(item, projectId)
    const startDate = item.startDate
        ? new Date(item.startDate).toLocaleDateString("vi-VN")
        : undefined
    const dueDate = item.dueDate
        ? new Date(item.dueDate).toLocaleDateString("vi-VN")
        : undefined

    const toLocalDateValue = (value?: string | null) => {
        if (!value) return undefined
        const date = new Date(value)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
    }
    const startDateValue = toLocalDateValue(item.startDate)
    const dueDateValue = toLocalDateValue(item.dueDate)
    const assigneeIds = Array.isArray(item.assignees)
        ? item.assignees
            .map((a) => (typeof a === "string" ? a : a._id))
            .filter((id): id is string => !!id)
        : undefined
    return {
        ...task,
        status: item.status,
        assigneeIds,
        startDate,
        dueDate,
        startDateValue,
        dueDateValue,
        estimate: item.estimate ?? undefined,
        createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : undefined,
        updatedAt: item.updatedAt ? new Date(item.updatedAt).toLocaleString("vi-VN") : undefined,
    }
}
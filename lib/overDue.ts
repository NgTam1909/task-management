import { TaskStatus } from "@/types/task"

type TaskLike = {
    dueDate?: string | Date | null
    startDate?: string | Date | null
    updatedAt?: string | Date | null
    startedAt?: string | Date | null
    estimate?: number | null
    status: string
}

function startOfDay(date: Date) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
}

function parseDate(value?: string | Date | null) {
    if (!value) return null

    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
            return null
        }

        return value
    }

    const d = new Date(value)

    if (Number.isNaN(d.getTime())) {
        return null
    }

    return d
}

export function parseDateOnly(
    value?: string | Date | null
) {
    const d = parseDate(value)

    if (!d) {
        return null
    }

    return startOfDay(d)
}

export function getTaskOverDue(
    task: TaskLike,
    now = new Date()
) {
    const today = startOfDay(now)
    const dueDate = parseDateOnly(task.dueDate)

    const isFinished =
        task.status === TaskStatus.DONE ||
        task.status === TaskStatus.CANCELLED||
        task.status === TaskStatus.PENDING_REVIEW

    const isDueToday =
        !!dueDate &&
        dueDate.getTime() === today.getTime() &&
        !isFinished

    const isOverdue =
        !!dueDate &&
        dueDate.getTime() < today.getTime()

    let isDelayed = false

    if (
        !isFinished &&
        task.status === TaskStatus.IN_PROGRESS &&
        task.startedAt &&
        typeof task.estimate === "number"
    ) {
        const startedAt = parseDate(task.startedAt)

        if (startedAt) {
            const estimateMs = task.estimate * 60 * 60 * 1000
            const elapsedMs = now.getTime() - startedAt.getTime()
            isDelayed = elapsedMs > estimateMs
        }
    }

    return {
        dueDate,
        isDueToday,
        isOverdue,
        isDelayed,
        isWarning: isDueToday || isOverdue || isDelayed,
        label: isOverdue
            ? "Quá hạn"
            : isDelayed
                ? "Chậm tiến độ"
                : isDueToday
                    ? "Cảnh báo"
                    : null,
    }
}
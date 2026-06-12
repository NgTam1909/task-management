
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Task, PriorityLevel, TaskStatus } from '@/types/task'
import { getTaskOverDue} from "@/lib/overDue"
type Props = {
    task: Task
    extraContent?: React.ReactNode
    hasExtraColumn?: boolean
}

function formatDateDDMMYYYY(dateStr?: string) {
    if (!dateStr) return '--'

    const d = new Date(dateStr)

    if (Number.isNaN(d.getTime())) return '--'

    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()

    return `${dd}/${mm}/${yyyy}`
}
function formatDateTime(dateStr?: string | Date | null) {
    if (!dateStr) return "--"

    const d = new Date(dateStr)

    if (Number.isNaN(d.getTime())) return "--"

    return d.toLocaleString("vi-VN")
}
function getElapsedTime(startedAt?: string | Date | null) {
    if (!startedAt) return ""
    const start = new Date(startedAt)
    if (Number.isNaN(start.getTime())) return ""
    const diffMs = Date.now() - start.getTime()
    const totalMinutes = Math.floor(diffMs / (1000 * 60))
    const totalHours = Math.floor(totalMinutes / 60)
    const totalDays = Math.floor(totalHours / 24)

    if (totalDays > 0) {
        return `${totalDays} ngày ${totalHours % 24} giờ`
    }
    if (totalHours > 0) {
        return `${totalHours} giờ ${totalMinutes % 60} phút`
    }
    return `${totalMinutes} phút`
}
function priorityPill(priority?: string | null) {
    const normalized = String(priority ?? '').toLowerCase()

    switch (normalized) {
        case PriorityLevel.HIGH:
            return {
                label: 'High',
                className: 'bg-red-500 text-white border-red-500',
            }

        case PriorityLevel.MEDIUM:
            return {
                label: 'Medium',
                className: 'bg-neutral-400 text-white border-neutral-400',
            }

        case PriorityLevel.LOW:
            return {
                label: 'Low',
                className: 'bg-white text-black border-black',
            }

        default:
            return {
                label: 'None',
                className: 'bg-white text-black border-black/50',
            }
    }
}

function statusLabel(status: TaskStatus) {
    switch (status) {
        case TaskStatus.TODO: return 'To do'
        case TaskStatus.IN_PROGRESS: return 'In progress'
        case TaskStatus.PENDING_REVIEW: return 'Pending review'
        case TaskStatus.DONE: return 'Done'
        case TaskStatus.CANCELLED: return 'Cancelled'
        case TaskStatus.BACKLOG: return 'Backlog'
        default: return String(status)
    }
}

export function TaskRow({
                            task,
                            extraContent,
                            hasExtraColumn = false,
                        }: Props) {
    const router = useRouter()
    const pill = priorityPill(task.priority)
    const code = (task.code ?? task.id ?? '').toString()
    const start = formatDateDDMMYYYY(task.startDate)
    const due = formatDateDDMMYYYY(task.dueDate)
    const elapsedTime = getElapsedTime(task.startedAt)
    const completedAt = formatDateTime(task.completedAt)
    const { isWarning, label } = getTaskOverDue(task)

    function goDetail() {
        if (!task.projectId) return
        router.push(`/project/${task.projectId}/tasks?taskId=${task.id}`)
    }

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={goDetail}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    goDetail()
                }
            }}
            className={cn(
                "border  border-black rounded-lg cursor-pointer hover:bg-black/3 ",
                isWarning && "outline outline-red-600"
            )}
        >
            {/* MOBILE CARD - chỉ hiện trên sm trở xuống */}
            <div className="xl:hidden  p-2 m-2 ">
                   <div className="text-xs text-muted-foreground">
                                ID: {task.code}
                            </div>

                            <div className="font-medium">{task.title}</div>
                            <div className="text-sm"> {task.description} </div>
                            <div className="text-sm">
                                <span className="font-semibold">Thời hạn:</span>{" "}
                                {task.startDate
                                ? new Date(task.startDate).toLocaleDateString()
                                : "N/A"}-
                                {task.dueDate
                                    ? new Date(task.dueDate).toLocaleDateString()
                                    : "N/A"}
                            </div>

                            <div className="text-sm">
                                <span className="font-semibold">Ưu tiên:</span>{" "}
                                {task.priority ?? "None"}
                            </div>

                            <div className="text-sm">
                                <span className="font-semibold">Trạng thái:</span>{" "}
                                <span>{statusLabel(task.status)}</span>
                                {isWarning && (
                                    <span className="rounded-md border border-red-600 px-2 py-0.5 text-xs font-bold text-red-600">
                                {label}
                            </span>
                                )}
                                {task.status === TaskStatus.DONE && task.completedAt && (
                                    <div className="text-sm text-right text-green-600">
                                        {completedAt}
                                    </div>
                                )}
                                {task.status === TaskStatus.IN_PROGRESS && task.startedAt && (
                                <div className="text-sm text-right text-green-600">
                                    {elapsedTime}
                                </div>
                            )}
                            </div>
            </div>
            {/* DESKTOP ROW - chỉ hiện trên sm trở lên */}

            <div
                className={cn(
                    "hidden xl:grid items-center",
                    hasExtraColumn
                        ? "grid-cols-[120px_200px_1fr_120px_150px_150px_180px]"
                        : "grid-cols-[120px_200px_1fr_120px_150px_150px]"
                )}
            >
                <div className="px-5 py-4 text-sm font-semibold text-center">{code}</div>
                <div className="px-5 py-4 text-sm font-semibold truncate ">{task.title}</div>
                <div className="pr-5 py-4 text-sm truncate">{task.description}</div>
                <div className=" py-4 text-sm">{start}<br/>→{due}</div>
                <div className="px-5 py-4 text-center">
                    <span className={cn(
                        "inline-flex w-30 justify-center rounded-full border px-6 py-1 text-sm font-bold text-center",
                        pill.className
                    )}>
                        {pill.label}
                    </span>
                </div>
                <div className="pl-5 py-4 text-sm text-center">
                    <div className="flex items-center gap-2">
                        <span>{statusLabel(task.status)}</span>
                        {isWarning && (
                            <span className="rounded-md border border-red-600 px-2 py-0.5 text-xs font-bold text-red-600">
                                {label}
                            </span>
                        )}
                    </div>
                    {task.status === TaskStatus.DONE &&
                        task.completedAt && (
                            <span className="text-xs text-right text-green-600">
                                {completedAt}</span>
                            )}
                    {task.status === TaskStatus.IN_PROGRESS &&
                        task.startedAt && (
                            <span className="text-xs text-right text-green-600">
                                {elapsedTime}</span>
                        )}
                </div>
                {extraContent}
            </div>
        </div>
    )
}
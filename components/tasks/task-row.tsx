
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Task, PriorityLevel, TaskStatus } from '@/types/task'
import { getTaskOverDue} from "@/lib/overDue"
type Props = {
    task: Task
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
        case TaskStatus.TODO:
            return 'To do'

        case TaskStatus.IN_PROGRESS:
            return 'In progress'

        case TaskStatus.PENDING_REVIEW:
            return 'Pending review'

        case TaskStatus.DONE:
            return 'Done'

        case TaskStatus.CANCELLED:
            return 'Cancelled'

        case TaskStatus.BACKLOG:
            return 'Backlog'

        default:
            return String(status)
    }
}

export function TaskRow({ task }: Props) {
    const router = useRouter()
    const pill = priorityPill(task.priority)
    const code = (task.code ?? task.id ?? '').toString()
    const due = formatDateDDMMYYYY(task.dueDate)
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
                "border  border-black rounded-lg cursor-pointer hover:bg-black/[0.03] ",
                isWarning && "outline outline-2 outline-red-600"
            )}
        >
            {/* MOBILE CARD - chỉ hiện trên sm trở xuống */}
            <div className="xl:hidden  p-2 m-2 ">
                   <div className="text-xs text-muted-foreground">
                                ID: {task.code}
                            </div>

                            <div className="font-medium">{task.title}</div>

                            <div className="text-sm">
                                <span className="font-semibold">Thời hạn:</span>{" "}
                                {task.dueDate
                                    ? new Date(task.dueDate).toLocaleDateString()
                                    : "Không có"}
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
                            </div>
            </div>
            {/* DESKTOP ROW - chỉ hiện trên sm trở lên */}

            <div className="hidden xl:grid grid-cols-[140px_1fr_100px_150px_160px]">
                <div className="px-5 py-4 text-sm font-semibold">{code}</div>
                <div className="px-5 py-4 text-sm font-semibold truncate">{task.title}</div>
                <div className="px-5 py-4 text-sm">{due}</div>
                <div className="px-5 py-4">
                    <span className={cn(
                        "inline-flex w-[120px] justify-center rounded-full border px-6 py-1 text-sm font-bold",
                        pill.className
                    )}>
                        {pill.label}
                    </span>
                </div>
                <div className="px-5 py-4 text-sm">
                    <div className="flex items-center gap-2">
                        <span>{statusLabel(task.status)}</span>
                        {isWarning && (
                            <span className="rounded-md border border-red-600 px-2 py-0.5 text-xs font-bold text-red-600">
                                {label}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

"use client"
// giao diện list task
import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { KanbanColumn } from "@/components/tasks/task-list"
import { Task, TaskStatus } from "@/types/task"
import {  ProjectInfo } from "@/types/project"
import { getProjectTasks, updateTask } from "@/services/task.service"
import { toTaskDetail } from "@/lib/mappers/task"
const statusColumns: Array<{ title: string; status: TaskStatus }> = [
    { title: "Backlog", status: TaskStatus.BACKLOG },
    { title: "Todo", status: TaskStatus.TODO },
    { title: "In Progress", status: TaskStatus.IN_PROGRESS },
    { title: "Pending review", status: TaskStatus.PENDING_REVIEW},
    { title: "Done", status: TaskStatus.DONE },
    { title: "Cancelled", status: TaskStatus.CANCELLED },
]

export default function ProjectTaskListPage() {
    const params = useParams<{ projectId: string }>()
    const projectId = params?.projectId

    const [project, setProject] = useState<ProjectInfo | null>(null)
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null)
    const [reloadKey, setReloadKey] = useState(0)
    const boardRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const handler = () => setReloadKey((key) => key + 1)
        window.addEventListener("task:created", handler)
        window.addEventListener("task:updated", handler)
        return () => {
            window.removeEventListener("task:created", handler)
            window.removeEventListener("task:updated", handler)
        }
    }, [])

    useEffect(() => {
        let active = true

        const load = async () => {
            if (!projectId) return
            try {
                const data = await getProjectTasks(projectId)
                if (!active) return
                setProject(data?.project ?? null)
                const mapped = Array.isArray(data?.tasks)
                    ? data.tasks.map((task) => toTaskDetail(task, projectId))
                    : []
                setTasks(mapped)
            } catch {
                if (active) {
                    setProject(null)
                    setTasks([])
                }
            } finally {
                if (active) setLoading(false)
            }
        }

        void load()

        return () => {
            active = false
        }
    }, [projectId, reloadKey])

    const columns = useMemo(
        () =>
            statusColumns.map((column) => ({
                ...column,
                tasks: tasks.filter((task) => task.status === column.status),
            })),
        [tasks]
    )

    const handleDragStart = (task: Task, event: React.DragEvent<HTMLDivElement>) => {
        event.dataTransfer.setData("text/task-id", task.id)
        event.dataTransfer.setData("text/task-status", task.status)
        event.dataTransfer.effectAllowed = "move"
    }

    const handleDragEnd = () => {
        setDragOverStatus(null)
    }

    const handleDragOver = (status: TaskStatus, event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setDragOverStatus(status)
        event.dataTransfer.dropEffect = "move"
        const board = boardRef.current
        if (!board) return
        const rect = board.getBoundingClientRect()
        const edgeThreshold = 80
        const speed = 20
        if (event.clientX - rect.left < edgeThreshold) {
            board.scrollLeft -= speed
        } else if (rect.right - event.clientX < edgeThreshold) {
            board.scrollLeft += speed
        }
    }

    const handleDragLeave = (status: TaskStatus, event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        if (dragOverStatus === status) {
            setDragOverStatus(null)
        }
    }

    const handleDrop = async (
        status: TaskStatus,
        event: React.DragEvent<HTMLDivElement>
    ) => {
        event.preventDefault()
        setDragOverStatus(null)

        const taskId = event.dataTransfer.getData("text/task-id")
        const fromStatus = event.dataTransfer.getData("text/task-status") as TaskStatus

        if (!taskId || !fromStatus || fromStatus === status) return

        const task = tasks.find((item) => item.id === taskId)
        if (!task) return

        // Validate frontend trước
        if (
            fromStatus === TaskStatus.BACKLOG &&
            status === TaskStatus.TODO &&
            (!task.assigneeIds || task.assigneeIds.length === 0)
        ) {
            window.alert("Cần gán assignee trước khi chuyển sang Todo.")
            return
        }

        try {
            // Gọi backend trước
            await updateTask(taskId, { status })

            // Chỉ update UI nếu backend success
            setTasks((prev) =>
                prev.map((item) =>
                    item.id === taskId
                        ? { ...item, status }
                        : item
                )
            )

            window.dispatchEvent(new Event("task:updated"))

        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                "Cập nhật trạng thái thất bại."

            window.alert(msg)

        }
    }
    return (
        <div className="space-y-6">
            <section className="space-y-2">
                <h1 className="text-xl font-semibold">{project?.title ?? "Task list"}</h1>
                {project?.projectId && (
                    <p className="text-sm text-muted-foreground">{project.projectId}</p>
                )}
                {loading && <p className="text-sm text-muted-foreground">Đang tải tasks...</p>}
                {!loading && tasks.length === 0 && (
                    <p className="text-sm text-muted-foreground">Chưa có task nào.</p>
                )}
            </section>

            <section>
                <div ref={boardRef} className="flex gap-4 overflow-x-auto pb-2">
                    {columns.map((column) => (
                        <KanbanColumn
                            key={column.status}
                            title={column.title}
                            status={column.status}
                            tasks={column.tasks}
                            isDragOver={dragOverStatus === column.status}
                            onTaskDragStart={handleDragStart}
                            onTaskDragEnd={handleDragEnd}
                            onTaskDragOver={handleDragOver}
                            onTaskDragLeave={handleDragLeave}
                            onTaskDrop={handleDrop}
                        />
                    ))}
                </div>
            </section>
        </div>
    )
}

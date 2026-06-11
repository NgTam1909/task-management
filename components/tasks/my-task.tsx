'use client'

import {useCallback, useEffect, useMemo, useState} from 'react'
import { getMyTasks } from '@/services/task.service'
import { Task, PriorityLevel, TaskStatus } from '@/types/task'
import { TaskRow } from '@/components/tasks/task-row'

function parseDateOnly(dateStr?: string) {
  if (!dateStr) return null

  const d = new Date(dateStr)

  if (Number.isNaN(d.getTime())) return null

  d.setHours(0, 0, 0, 0)

  return d
}

function priorityRank(priority?: string | null) {
  const normalized = String(priority ?? '').toLowerCase()

  switch (normalized) {
    case PriorityLevel.HIGH:
      return 3
    case PriorityLevel.MEDIUM:
      return 2
    case PriorityLevel.LOW:
      return 1
    default:
      return 0
  }
}

function statusRank(status: TaskStatus) {
  switch (status) {
    case TaskStatus.IN_PROGRESS:
      return 0
    case TaskStatus.TODO:
      return 1
    case TaskStatus.PENDING_REVIEW:
      return 2
    case TaskStatus.BACKLOG:
      return 3
    case TaskStatus.DONE:
      return 4
    case TaskStatus.CANCELLED:
      return 5
    default:
      return 99
  }
}

function sortTasks(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    const sr = statusRank(a.status) - statusRank(b.status)
    if (sr !== 0) return sr

    const dueA = parseDateOnly(a.dueDate)
    const dueB = parseDateOnly(b.dueDate)

    if (dueA && dueB) {
      const diff = dueA.getTime() - dueB.getTime()
      if (diff !== 0) return diff
    } else if (dueA && !dueB) {
      return -1
    } else if (!dueA && dueB) {
      return 1
    }

    const pr = priorityRank(b.priority) - priorityRank(a.priority)
    if (pr !== 0) return pr

    return String(a.title ?? '').localeCompare(
        String(b.title ?? ''),
        'vi'
    )
  })
}

export function MyTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    setError(null)

    try {
      const res = await getMyTasks()
      const nextTasks = Array.isArray(res?.tasks) ? res.tasks : []
      setTasks(nextTasks)
    } catch {
      setError('Không thể tải danh sách công việc')
    } finally {
      setLoading(false)
    }
  }, [])

  // 2. Chạy lần đầu khi mount
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // 3. Lắng nghe sự kiện để reload
  useEffect(() => {
    const handler = () => {
      console.log("Sự kiện Task thay đổi -> Đang cập nhật danh sách...")
      fetchTasks(true) // Load ngầm (silent) để không hiện loading spinner làm phiền người dùng
    }

    window.addEventListener("task:created", handler)
    window.addEventListener("task:updated", handler)

    return () => {
      window.removeEventListener("task:created", handler)
      window.removeEventListener("task:updated", handler)
    }
  }, [fetchTasks])

  const sortedTasks = useMemo(() => {
    return sortTasks(tasks)
  }, [tasks])

  if (loading) {
    return (
        <div className="flex min-h-80 items-center justify-center">
          <div className="text-sm text-muted-foreground">
            Đang tải...
          </div>
        </div>
    )
  }

  return (
      <section className="w-full py-2">
        <div className="w-full p-3">
          {/* Header */}
          <div className="hidden xl:grid grid-cols-[120px_1fr_120px_150px_150px] gap-2 border bg-white sticky top-0 z-10">
            <div className="px-4 py-2 text-sm text-center font-semibold">Mã công việc</div>
            <div className="px-4 py-2 text-sm text-center font-semibold">Tiêu đề</div>
            <div className="px-4 py-2 text-sm text-center font-semibold">Thời gian</div>
            <div className="px-4 py-2 text-sm text-center font-semibold">Ưu tiên</div>
            <div className="px-4 py-2 text-sm text-center font-semibold">Trạng thái</div>
          </div>

          {/* Nội dung scroll */}
          <div className="max-h-100 overflow-y-auto border-x border-b">
            {error ? (
                <div className="px-5 py-6 text-sm text-red-600">
                  {error}
                </div>
            ) : sortedTasks.length === 0 ? (
                <div className="px-5 py-10 text-sm text-muted-foreground">
                  Không có công việc nào
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 gap-4 p-2 ">
                  {sortedTasks.map((task) => (
                      <TaskRow key={task.id} task={task} />
                  ))}
                </div>
            )}
          </div>
        </div>
      </section>
  )
}
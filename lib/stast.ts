import { Task } from "@/types/task"
import { getTaskOverDue } from "@/lib/overDue"

export function buildAdvancedStats(tasks: Task[] = []) {
  const now = new Date()

  let overdue = 0

  const statusCount = {
    backlog: 0,
    todo: 0,
    inprogress: 0,
    pending_review: 0,
    done: 0,
    cancelled: 0,
  }

  const userMap: Record<string, number> = {}

  tasks.forEach((t) => {
    statusCount[t.status]++

    if (getTaskOverDue(t, now).isOverdue) {
      overdue++
    }

    if (t.assignees?.length) {
      t.assignees.forEach((name) => {
        userMap[name] = (userMap[name] || 0) + 1
      })
    }
  })

  return {
    statusCount,
    overdue,
    userStats: Object.entries(userMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
  }
}
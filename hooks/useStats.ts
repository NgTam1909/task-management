'use client'

import { useMemo, useState } from "react"
import { buildAdvancedStats } from "@/lib/stast"
import { Task } from "@/types/task"
import { getTaskOverDue } from "@/lib/overDue";
import type { MonthlyItem, StatsListFilter } from "@/types/stats"

function monthKeyFromDate(date: Date) {
    return `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`
}

function isTaskOverdue(task: Task, now: Date) {
    return getTaskOverDue(task, now).isOverdue
}

export function useStats(tasks: Task[]) {
    const currentMonth = useMemo(() => monthKeyFromDate(new Date()), [])
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
    const [listFilter, setListFilter] = useState<StatsListFilter>({
        kind: "all",
    })

    const monthlyData = useMemo<MonthlyItem[]>(() => {
        const now = new Date()
        const map = new Map<string, MonthlyItem>()
        // Lấy tất cả các tháng có dữ liệu và sắp xếp
        const allMonthsSet = new Set<string>()

        tasks.forEach((task) => {
            if (task.createdAt) {
                allMonthsSet.add(monthKeyFromDate(new Date(task.createdAt)))
            }
            if (task.status === "done" && task.updatedAt) {
                allMonthsSet.add(monthKeyFromDate(new Date(task.updatedAt)))
            }
            if (task.status === "cancelled" && task.updatedAt) {
                allMonthsSet.add(monthKeyFromDate(new Date(task.updatedAt)))
            }
        })

        const sortedMonths = Array.from(allMonthsSet).sort((a, b) => {
            const [monthA, yearA] = a.split('/')
            const [monthB, yearB] = b.split('/')
            return new Date(Number(yearA), Number(monthA) - 1).getTime() -
                new Date(Number(yearB), Number(monthB) - 1).getTime()
        })

        sortedMonths.forEach((month) => {
            const monthTasks = tasks.filter((t) => {
                if (!t.createdAt) {
                    return false
                }

                return (
                    monthKeyFromDate(
                        new Date(t.createdAt)
                    ) === month
                )
            })

            const openTasks = monthTasks.filter((t) =>
                t.status !== "done" &&
                t.status !== "cancelled" &&
                t.status !== "pending_review"
            ).length

            const completedTasks = monthTasks.filter(
                (t) => t.status === "done"
            ).length

            const cancelledTasks = monthTasks.filter(
                (t) => t.status === "cancelled"
            ).length

            const overdueTasks = monthTasks.filter((t) =>
                getTaskOverDue(t, now).isOverdue
            ).length

            map.set(month, {
                month,
                created: monthTasks.length,
                opening: openTasks, // task đang cần làm hiện tại
                completed: completedTasks,
                cancelled: cancelledTasks,
                overdue: overdueTasks,
            })
        })

        return Array.from(map.values())
    }, [tasks])

    const tasksInSelectedMonth = useMemo(() => {
        if (!selectedMonth) return tasks

        return tasks.filter((t) => {
            if (!t.createdAt) return false
            return monthKeyFromDate(new Date(t.createdAt)) === selectedMonth
        })
    }, [tasks, selectedMonth])

    const { statusCount } = useMemo(() => {
        return buildAdvancedStats(tasksInSelectedMonth)
    }, [tasksInSelectedMonth])

    const pieData = useMemo(() => {
        return Object.entries(statusCount).map(([name, value]) => ({
            name,
            value,
        }))
    }, [statusCount])

    const overdueCount = useMemo(() => {
        const now = new Date()

        return tasks.filter((task) => {
            if (
                task.status === "done" ||
                task.status === "cancelled" ||
                task.status === "pending_review"
            ) {
                return false
            }

            return getTaskOverDue(task, now).isOverdue
        }).length
    }, [tasks])
    const pendingReviewCount = useMemo(() => {
        return tasks.filter((t) => t.status === "pending_review").length
    }, [tasks])
    const completedCount = useMemo(() => {
        return tasks.filter((t) => t.status === "done").length
    }, [tasks])

    const cancelledCount = useMemo(() => {
        return tasks.filter((t) => t.status === "cancelled").length
    }, [tasks])

    const filteredTasks = useMemo(() => {
        const now = new Date()

        // Bước 1: Lọc theo tháng nếu có selectedMonth
        let monthFilteredTasks = tasks
        if (selectedMonth) {
            monthFilteredTasks = tasks.filter((t) => {
                if (!t.createdAt) return false
                return monthKeyFromDate(new Date(t.createdAt)) === selectedMonth
            })
        }

        // Bước 2: Lọc theo filter (all/done/cancelled/overdue/status)
        if (listFilter.kind === "all") return monthFilteredTasks
        if (listFilter.kind === "done") {
            return monthFilteredTasks.filter((t) => t.status === "done")
        }
        if (listFilter.kind === "cancelled") {
            return monthFilteredTasks.filter((t) => t.status === "cancelled")
        }
        if (listFilter.kind === "review") {
            return monthFilteredTasks.filter((t) => t.status === "pending_review")
        }
        if (listFilter.kind === "status") {
            return monthFilteredTasks.filter((t) => t.status === listFilter.status)
        }
        if (listFilter.kind === "overdue") {
            return monthFilteredTasks.filter((t) => isTaskOverdue(t, now))
        }

        return monthFilteredTasks
    }, [tasks, listFilter, selectedMonth])
    return {
        currentMonth,
        selectedMonth,
        setSelectedMonth,
        listFilter,
        setListFilter,
        monthlyData,
        pieData,
        filteredTasks,
        totalCount: tasks.length,
        completedCount,
        overdueCount,
        cancelledCount,
        pendingReviewCount,
    }
}
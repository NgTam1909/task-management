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
        let carryOver = 0

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
            const newTasks = tasks.filter(t =>
                t.createdAt && monthKeyFromDate(new Date(t.createdAt)) === month
            ).length

            const completedTasks = tasks.filter(t =>
                t.status === "done" && t.updatedAt &&
                monthKeyFromDate(new Date(t.updatedAt)) === month
            ).length

            const cancelledTasks = tasks.filter(t =>
                t.status === "cancelled" && t.updatedAt &&
                monthKeyFromDate(new Date(t.updatedAt)) === month
            ).length

            const overdueTasks = tasks.filter((t) => {
                if (!t.dueDate) return false

                return (
                    monthKeyFromDate(new Date(t.dueDate)) === month &&
                    getTaskOverDue(t, now).isOverdue
                )
            }).length
            map.set(month, {
                month,
                created: newTasks,
                completed: completedTasks,
                overdue: overdueTasks,
                carryOver: carryOver,
                cancelled: cancelledTasks
            })
            carryOver = Math.max(
                0,
                carryOver + newTasks - completedTasks - cancelledTasks
            )
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
        return tasks.filter((task) =>
            getTaskOverDue(task, now).isOverdue
        ).length
    }, [tasks])

    const completedCount = useMemo(() => {
        return tasks.filter((t) => t.status === "done").length
    }, [tasks])

    const cancelledCount = useMemo(() => {
        return tasks.filter((t) => t.status === "cancelled").length
    }, [tasks])

    const filteredTasks = useMemo(() => {
        const now = new Date()

        if (listFilter.kind === "all") return tasks
        if (listFilter.kind === "done") {
            return tasks.filter((t) => t.status === "done")
        }
        if (listFilter.kind === "cancelled") {
            return tasks.filter((t) => t.status === "cancelled")
        }
        if (listFilter.kind === "status") {
            return tasks.filter((t) => t.status === listFilter.status)
        }

        // overdue
        return tasks.filter((t) => isTaskOverdue(t, now))
    }, [tasks, listFilter])

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
    }
}
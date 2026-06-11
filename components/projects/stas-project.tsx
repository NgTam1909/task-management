'use client'

import { type ReactNode, useEffect, useState, useCallback } from "react"
import ClickablePie from "@/components/chart/pie-chart"
import TaskMonthlyChart from "@/components/chart/combo-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GET_METHOD } from "@/lib/req"
import { useStats } from "@/hooks/useStats"
import { ApiResponse } from "@/types/project"
import { Task } from "@/types/task"
import { CheckCircle2, Clock3, ListTodo, CircleX, CircleDashed } from "lucide-react"
import { toTask } from "@/lib/mappers/task"
import { TaskRow } from "@/components/tasks/task-row"
import GanttChart from "@/components/chart/gant-chart";
type Props = {
    projectId: string
}

export default function AdvancedDashboard({ projectId }: Props) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // 👉 Tách riêng hàm loadTasks để tái sử dụng
    const loadTasks = useCallback(async () => {
        if (!projectId) return

        try {
            setLoading(true)
            setError(null)

            const data = (await GET_METHOD(
                `/api/projects/${projectId}/tasks`
            )) as ApiResponse

            const items = Array.isArray(data?.tasks) ? data.tasks : []
            setTasks(items.map((item) => toTask(item, projectId)))
        } catch {
            setTasks([])
            setError("Không thể tải danh sách task")
        } finally {
            setLoading(false)
        }
    }, [projectId])

    // Load lần đầu
    useEffect(() => {
        loadTasks()
    }, [loadTasks])

    // 👉 Lắng nghe các event refresh (cập nhật real-time)
    useEffect(() => {
        const handleTaskCreated = () => {
            loadTasks()
        }
        const handleTaskUpdated = () => {
            loadTasks()
        }
        const handleTaskDeleted = () => {
            loadTasks()
        }
        
        window.addEventListener('task:created', handleTaskCreated)
        window.addEventListener('task:updated', handleTaskUpdated)
        window.addEventListener('task:deleted', handleTaskDeleted)

        return () => {
            window.removeEventListener('task:created', handleTaskCreated)
            window.removeEventListener('task:updated', handleTaskUpdated)
            window.removeEventListener('task:deleted', handleTaskDeleted)
        }
    }, [loadTasks])

    const {
        selectedMonth,
        setSelectedMonth,
        listFilter,
        setListFilter,
        monthlyData,
        pieData,
        filteredTasks,
        totalCount,
        completedCount,
        overdueCount,
        cancelledCount,
        pendingReviewCount,
    } = useStats(tasks)

    const filterLabel =
        listFilter.kind === "all"
            ? null
            : listFilter.kind === "done"
                ? "done"
                : listFilter.kind === "overdue"
                    ? "overdue"
                    : listFilter.kind === "cancelled"
                        ? "cancelled"
                    :listFilter.kind === "review"
                        ? "review"
                        : listFilter.status
    const tasksWithAssigneeSorted = [...tasks].sort((a, b) => {
        // Giả sử task có thuộc tính assignee hoặc list assignees
        return (b.assignees?.length || 0) - (a.assignees?.length || 0);
    });
    return (
        <div className="space-y-6">
            {/* STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                <StatCard
                    title="Tổng công việc"
                    value={totalCount}
                    icon={<ListTodo className="h-5 w-5" />}
                    active={listFilter.kind === "all" && !selectedMonth}
                    onClick={() => {
                        setListFilter({ kind: "all" })
                        setSelectedMonth(null)
                    }}
                />
                <StatCard
                    title="Chở xét duyệt"
                    value={pendingReviewCount}
                    icon={<CircleDashed className="h-5 w-5 text-orange-500" />}
                    active={listFilter.kind === "review"}
                    onClick={() => setListFilter({ kind: "review" })}
                />
                <StatCard
                    title="Đã hoàn thành"
                    value={completedCount}
                    icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
                    active={listFilter.kind === "done"}
                    onClick={() => setListFilter({ kind: "done" })}
                />

                <StatCard
                    title="Quá hạn"
                    value={overdueCount}
                    icon={<Clock3 className="h-5 w-5 text-red-500" />}
                    active={listFilter.kind === "overdue"}
                    onClick={() => setListFilter({ kind: "overdue" })}
                />
                <StatCard
                    title="Đã hủy"
                    value={cancelledCount}
                    icon={<CircleX className="h-5 w-5 text-red-500" />}
                    active={listFilter.kind === "cancelled"}
                    onClick={() => setListFilter({ kind: "cancelled" })}
                />
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* PIE */}
                <Card className="rounded-2xl">
                    <CardHeader>
                        <CardTitle>Trạng thái công việc</CardTitle>
                        {selectedMonth
                            ? <>Thống kê theo tháng: <span className="font-medium">{selectedMonth}</span></>
                            : <>Thống kê toàn bộ dự án</>}
                    </CardHeader>

                    <CardContent>
                        <ClickablePie
                            data={pieData}
                            onClick={(name: string) =>
                                setListFilter({ kind: "status", status: name })
                            }
                        />
                    </CardContent>
                </Card>

                {/* MONTHLY */}
                <Card className="rounded-2xl ">
                    <CardHeader>
                        <CardTitle>Tiến độ dự án</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Nhấn vào cột tháng để xem trạng thái các task trong tháng đó
                        </p>
                    </CardHeader>

                    <CardContent>
                        <TaskMonthlyChart
                            data={monthlyData}
                            onSelectMonth={(month) => setSelectedMonth(month)}
                        />
                    </CardContent>
                </Card>
            </div>
            {/* Thêm phần Gantt Chart mới */}
            <Card className="rounded-2xl">
                <CardHeader>
                    <CardTitle>Biểu đồ tiến độ (Custom)</CardTitle>
                </CardHeader>
                <CardContent>
                    <GanttChart tasks={filteredTasks} />
                </CardContent>
            </Card>
            {/* FILTER */}
            {filterLabel && (
                <div className="flex items-center justify-between rounded-xl border px-4 py-3 bg-muted/30">
                    <span className="text-sm">
                        Đang lọc theo:{" "}
                        <span className="font-semibold">{filterLabel}</span>
                    </span>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setListFilter({ kind: "all" })}
                    >
                        Xóa lọc
                    </Button>
                </div>
            )}

            {/* TASK LIST */}
            <Card className="rounded-2xl">
                <CardHeader>
                    <CardTitle>Danh sách công việc</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {filteredTasks.length} công việc hiển thị
                    </p>
                </CardHeader>

                <CardContent className="space-y-3">
                    <div className="hidden xl:grid grid-cols-[120px_1fr_120px_150px_150px_180px] gap-2 border bg-white sticky top-0 z-10">
                        <div className="px-4 py-2 text-sm text-center font-semibold">Mã công việc</div>
                        <div className="px-4 py-2 text-sm text-center font-semibold">Tiêu đề</div>
                        <div className="px-4 py-2 text-sm text-center font-semibold">Thời gian</div>
                        <div className="px-4 py-2 text-sm text-center font-semibold">Ưu tiên</div>
                        <div className="px-4 py-2 text-sm text-center font-semibold">Trạng thái</div>
                        <div className="px-4 py-2 text-sm text-center font-semibold">Người thực hiện</div>
                    </div>
                    {loading && (
                        <p className="text-sm text-muted-foreground">
                            Đang tải dữ liệu...
                        </p>
                    )}

                    {!loading && error && (
                        <p className="text-sm text-red-500">{error}</p>
                    )}

                    {!loading && !error && filteredTasks.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            Không có dữ liệu phù hợp.
                        </p>
                    )}

                    {!loading &&
                        !error &&
                        filteredTasks.map((task) => (
                            <TaskRow
                                key={task.id}
                                task={task}
                                hasExtraColumn
                                extraContent={
                                    <div className="text-center">
                                        {task.assignees}
                                    </div>
                                }
                            />
                        ))}
                </CardContent>
            </Card>
        </div>
    )
}

// StatCard component giữ nguyên
function StatCard({
                      title,
                      value,
                      icon,
                      active,
                      onClick,
                  }: {
    title: string
    value: number
    icon: ReactNode
    active?: boolean
    onClick?: () => void
}) {
    return (
        <Card
            className={[
                "rounded-2xl",
                onClick ? "cursor-pointer hover:bg-muted/30 transition" : "",
                active ? "ring-1 ring-primary/30" : "",
            ].join(" ")}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={(e) => {
                if (!onClick) return
                if (e.key === "Enter" || e.key === " ") onClick()
            }}
        >
            <CardContent className="p-5 flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <h3 className="text-2xl font-bold mt-1">{value}</h3>
                </div>

                <div className="rounded-xl bg-muted p-3">{icon}</div>
            </CardContent>
        </Card>
    )
}
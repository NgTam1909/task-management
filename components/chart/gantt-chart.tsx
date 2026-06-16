"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Task } from "@/types/task";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface TaskLane {
    tasks: Task[];
}

interface AssigneeGroup {
    assignee: string;
    taskCount: number;
    doneCount: number;
    lanes: TaskLane[];
    email?: string;
    activeCount: number;
    overdueCount: number;
    completedCount: number;
    totalCount: number;
    managedCount: number;
}

export default function GanttChart({ tasks }: { tasks: Task[] }) {
    const router = useRouter();
    const visibleTasks = tasks.filter(
        (task) =>
            task.status !== "backlog" &&
            task.status !== "cancelled"
    );
    const { assigneeGroups, dayColumns } = useMemo(() => {
        if (!tasks || tasks.length === 0) {
            return { assigneeGroups: [], dateRange: { start: new Date(), end: new Date() }, dayColumns: [] };
        }
        // Nhóm task theo assignees
        const groupMap = new Map<string, Task[]>();
        visibleTasks.forEach((task) => {
            if (task.assignees && task.assignees.length > 0) {
                task.assignees.forEach((assignee) => {
                    if (!groupMap.has(assignee)) {
                        groupMap.set(assignee, []);
                    }
                    groupMap.get(assignee)!.push(task);
                });
            } else {
                // Nếu không có assignee
                const key = "Chưa phân công";
                if (!groupMap.has(key)) {
                    groupMap.set(key, []);
                }
                groupMap.get(key)!.push(task);
            }
        });

        // Tính toán khoảng ngày
        let minDate = new Date();
        let maxDate = new Date();
        let hasValidDate = false;

        visibleTasks.forEach((task) => {
            if (task.startDate) {
                const startDate = new Date(task.startDate);
                if (startDate < minDate) minDate = startDate;
                hasValidDate = true;
            }
            if (task.dueDate) {
                const dueDate = new Date(task.dueDate);
                if (dueDate > maxDate) maxDate = dueDate;
                hasValidDate = true;
            }
        });

        // Nếu không có ngày, dùng 14 ngày từ hôm nay
        if (!hasValidDate) {
            minDate = new Date();
            maxDate = new Date(minDate.getTime() + 14 * 24 * 60 * 60 * 1000);
        } else {
            // Thêm buffer trước và sau
            minDate.setDate(minDate.getDate());
            maxDate.setDate(maxDate.getDate() + 1);
        }

        // Tạo danh sách các ngày
        const dayColumns: Date[] = [];
        for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
            dayColumns.push(new Date(d));
        }
        //Tạo lane khi bị chồng thời gian task
        function createLanes(tasks: Task[]): TaskLane[] {
            const lanes: TaskLane[] = [];

            const sortedTasks = [...tasks].sort((a, b) => {
                const aStart = a.startDate
                    ? new Date(a.startDate).getTime()
                    : 0;

                const bStart = b.startDate
                    ? new Date(b.startDate).getTime()
                    : 0;

                return aStart - bStart;
            });

            sortedTasks.forEach((task) => {
                const taskStart = task.startDate
                    ? new Date(task.startDate).getTime()
                    : 0;

                let placed = false;

                for (const lane of lanes) {
                    const lastTask = lane.tasks[lane.tasks.length - 1];

                    const lastEnd = lastTask.dueDate
                        ? new Date(lastTask.dueDate).getTime()
                        : 0;

                    if (taskStart > lastEnd) {
                        lane.tasks.push(task);
                        placed = true;
                        break;
                    }
                }

                if (!placed) {
                    lanes.push({
                        tasks: [task],
                    });
                }
            });

            return lanes;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Xây dựng bản đồ ánh xạ từ tên hiển thị sang thông tin người dùng (ID, Email)
        const userRegistry = new Map<string, { id: string; name: string; email?: string }>();
        tasks.forEach((task) => {
            if (task.assigneeDetails) {
                task.assigneeDetails.forEach((detail) => {
                    if (detail.name && !userRegistry.has(detail.name)) {
                        userRegistry.set(detail.name, {
                            id: detail.id,
                            name: detail.name,
                            email: detail.email,
                        });
                    }
                });
            }
            if (task.assigneeIds && task.assignees) {
                task.assignees.forEach((name, idx) => {
                    const id = task.assigneeIds?.[idx];
                    if (id && name && !userRegistry.has(name)) {
                        userRegistry.set(name, {
                            id,
                            name,
                        });
                    }
                });
            }
            if (task.ownerId && task.ownerName) {
                if (!userRegistry.has(task.ownerName)) {
                    userRegistry.set(task.ownerName, {
                        id: task.ownerId,
                        name: task.ownerName,
                        email: task.ownerEmail,
                    });
                }
            }
        });

        // Sắp xếp theo số lượng task (giảm dần)
        const assigneeGroups: AssigneeGroup[] = Array.from(groupMap.entries())
            .map(([assignee, tasksGroup]) => {
                const sortedTasks = [...tasksGroup].sort((a, b) => {
                    const aStart = a.startDate
                        ? new Date(a.startDate).getTime()
                        : 0;

                    const bStart = b.startDate
                        ? new Date(b.startDate).getTime()
                        : 0;

                    return aStart - bStart;
                });
                const doneCount = tasksGroup.filter(
                    (t) => t.status === "done"
                ).length;

                // Thống kê dựa trên toàn bộ danh sách tasks của dự án
                const allAssigneeTasks = assignee === "Chưa phân công"
                    ? tasks.filter((t) => !t.assignees || t.assignees.length === 0)
                    : tasks.filter((t) => t.assignees?.includes(assignee));

                const totalCount = allAssigneeTasks.length;
                const completedCount = allAssigneeTasks.filter((t) => t.status === "done").length;
                
                // Số task đang làm bao gồm "to do" và "in progress"
                const activeCount = allAssigneeTasks.filter(
                    (t) => t.status === "todo" || t.status === "inprogress"
                ).length;

                const overdueCount = allAssigneeTasks.filter((t) => {
                    if (t.status === "done" || t.status === "cancelled") return false;
                    if (!t.dueDate) return false;
                    return new Date(t.dueDate) < today;
                }).length;

                const userInfo = userRegistry.get(assignee);
                const email = userInfo?.email;
                const userId = userInfo?.id;

                const managedCount = userId
                    ? tasks.filter((t) => {
                          return (
                              t.ownerId === userId &&
                              !(t.assigneeIds?.includes(userId) || t.assignees?.includes(assignee))
                          );
                      }).length
                    : 0;

                return {
                    assignee,
                    taskCount: tasksGroup.length,
                    doneCount,
                    lanes: createLanes(sortedTasks),
                    email,
                    activeCount,
                    overdueCount,
                    completedCount,
                    totalCount,
                    managedCount,
                };
            })
            .sort((a, b) => b.taskCount - a.taskCount);

        return { assigneeGroups, dateRange: { start: minDate, end: maxDate }, dayColumns };
    }, [tasks]);

    const getTaskPosition = (task: Task) => {
        if (!task.startDate || dayColumns.length === 0) {
            return { left: 0, width: 0 };
        }

        const startDate = new Date(task.startDate);
        const endDate = task.dueDate ? new Date(task.dueDate) : new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        const firstDay = new Date(dayColumns[0]);

        // Tính vị trí bắt đầu
        const daysFromStart = Math.max(
            0,
            Math.floor((startDate.getTime() - firstDay.getTime()) / (24 * 60 * 60 * 1000))
        );

        // Tính chiều rộng (số ngày)
        const duration = Math.max(
            1,
            Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1
        );

        const totalDays = dayColumns.length;
        const left = (daysFromStart / totalDays) * 100;
        const width = (duration / totalDays) * 100;

        return { left, width };
    };
    const getStatusLabel = (status: string) => {
        switch (status) {
            case "todo":
                return "Cần làm";
            case "inprogress":
                return "Đang thực hiện";
            case "pending_review":
                return "Chờ xét duyệt";
            case "done":
                return "Hoàn thành";
            case "cancelled":
                return "Đã hủy";
            default:
                return status;
        }
    };
    const getStatusColor = (status: string) => {
        switch (status) {
            case "done":
                return "bg-green-500";
            case "inprogress":
                return "bg-blue-500";
            case "pending_review":
                return "bg-yellow-500";
            case "cancelled":
                return "bg-red-400";
            default:
                return "bg-gray-300";
        }
    };
    const formatDate = (date: Date) => {
        return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    };

    return (
        <div className="overflow-x-auto border rounded-xl bg-background p-4">
            <div className="min-w-max">
                {/* Header với tiêu đề và cột ngày */}
                <div className="flex sticky top-0 z-20 bg-background border-b">
                    <div className="w-48 shrink-0 px-4 py-3 font-semibold border-r bg-gray-50">
                        Thành viên (KPI)
                    </div>
                    <div className="flex">
                        {dayColumns.map((day, idx) => (
                            <div
                                key={idx}
                                className="w-16 shrink-0 px-2 py-3 text-center text-xs font-medium border-r bg-gray-50"
                            >
                                <div>{formatDate(day)}</div>
                                <div className="text-gray-500">
                                    {day.toLocaleDateString("vi-VN", { weekday: "short" })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rows - Assignees grouped */}
                {assigneeGroups.map((group) => (
                    <div key={group.assignee}>
                        {/* Assignee header row */}
                        <div className="flex border-b bg-blue-50 hover:bg-blue-100 transition-colors">
                            <div className="flex flex-1">
                                {dayColumns.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className="w-16 shrink-0 border-r bg-blue-50"
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Task rows for this assignee */}
                        {group.lanes.map((lane, laneIndex) => (
                            <div
                                key={laneIndex}
                                className="flex border-b hover:bg-gray-50"
                            >
                                {/* chỉ hiển thị tên ở lane đầu tiên */}
                                <div className="w-48 shrink-0 border-r px-4 py-3">
                                    {laneIndex === 0 ? (
                                        group.assignee === "Chưa phân công" ? (
                                            <div className="font-medium text-gray-500">
                                                {group.assignee}
                                            </div>
                                        ) : (
                                            <HoverCard openDelay={200}>
                                                <HoverCardTrigger asChild>
                                                    <div className="font-medium cursor-pointer hover:text-blue-600 transition-colors flex items-center justify-between">
                                                        <span className="truncate max-w-25">{group.assignee}</span>
                                                        <span
                                                            className={cn(
                                                                "ml-2 text-xs px-2 py-0.5 rounded-full text-white shrink-0",
                                                                group.doneCount === group.taskCount
                                                                    ? "bg-green-600"
                                                                    : "bg-blue-600"
                                                            )}
                                                        >
                                                            {group.doneCount}/{group.taskCount}
                                                        </span>
                                                    </div>
                                                </HoverCardTrigger>
                                                <HoverCardContent className="w-80 p-4" align="start" side="right">
                                                    <div className="space-y-3">
                                                        <div className="border-b pb-2">
                                                            <h4 className="font-semibold text-sm text-foreground">
                                                                {group.assignee}
                                                            </h4>
                                                            <p className="text-xs text-muted-foreground truncate">
                                                                {group.email || "Không có email"}
                                                            </p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            <div className="bg-blue-50 p-2 rounded-lg dark:bg-blue-950/20">
                                                                <span className="text-muted-foreground block">Đang làm / Cần làm</span>
                                                                <span className="font-bold text-sm text-blue-600 dark:text-blue-400">
                                                                    {group.activeCount} task
                                                                </span>
                                                            </div>
                                                            <div className={cn(
                                                                "p-2 rounded-lg",
                                                                group.overdueCount > 0
                                                                    ? "bg-red-50 dark:bg-red-950/20"
                                                                    : "bg-gray-50 dark:bg-gray-800/20"
                                                            )}>
                                                                <span className="text-muted-foreground block">Quá hạn</span>
                                                                <span className={cn(
                                                                    "font-bold text-sm",
                                                                    group.overdueCount > 0
                                                                        ? "text-red-600 dark:text-red-400"
                                                                        : "text-gray-600 dark:text-gray-400"
                                                                )}>
                                                                    {group.overdueCount} task
                                                                </span>
                                                            </div>
                                                            <div className="bg-green-50 p-2 rounded-lg dark:bg-green-950/20 col-span-2 flex justify-between items-center">
                                                                <div>
                                                                    <span className="text-muted-foreground block">Tiến độ hoàn thành</span>
                                                                    <span className="font-bold text-sm text-green-600 dark:text-green-400">
                                                                        {group.completedCount} / {group.totalCount} task
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded dark:bg-green-900/30 dark:text-green-300">
                                                                    {group.totalCount > 0 ? Math.round((group.completedCount / group.totalCount) * 100) : 0}%
                                                                </span>
                                                            </div>
                                                            {group.managedCount > 0 && (
                                                                <div className="bg-purple-50 p-2 rounded-lg dark:bg-purple-950/20 col-span-2">
                                                                    <span className="text-muted-foreground block font-medium">Vai trò Leader / Chịu trách nhiệm</span>
                                                                    <span className="font-bold text-xs text-purple-700 dark:text-purple-400">
                                                                        Đang quản lý {group.managedCount} task (chịu trách nhiệm chính)
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </HoverCardContent>
                                            </HoverCard>
                                        )
                                    ) : null}
                                </div>

                                <div className="flex-1 flex relative">
                                    {dayColumns.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className="w-16 shrink-0 border-r h-16"
                                        />
                                    ))}

                                    {lane.tasks.map((task) => {
                                        const { left, width } = getTaskPosition(task);

                                        return (
                                            <HoverCard key={task.id} openDelay={200}>
                                                <HoverCardTrigger asChild>
                                                    <div
                                                        onClick={() => {
                                                            if (task.projectId) {
                                                                router.push(
                                                                    `/project/${task.projectId}/tasks?taskId=${task.id}`
                                                                );
                                                            }
                                                        }}
                                                        className={cn(
                                                            "absolute top-2 h-12 rounded-md px-2 flex items-center text-xs text-white cursor-pointer transition-all",
                                                            "shadow-sm hover:shadow-lg hover:scale-[1.02]",
                                                            getStatusColor(task.status),

                                                            // ưu tiên
                                                            task.priority === "high" &&
                                                            "ring-2 ring-red-600 ring-offset-1",
                                                            task.priority === "medium" &&
                                                            "ring-2 ring-yellow-600 ring-offset-1",
                                                            task.priority === "low" &&
                                                            "ring-2 ring-gray-600 ring-offset-1"
                                                        )}
                                                        style={{
                                                            left: `calc(${left}% + 4px)`,
                                                            width: `calc(${width}% - 8px)`,
                                                        }}
                                                    >
                                                        <span className="truncate">
                                                            {task.code}
                                                        </span>
                                                    </div>
                                                </HoverCardTrigger>

                                                <HoverCardContent
                                                    className="w-80"
                                                    align="start"
                                                    side="top"
                                                >
                                                    <div className="space-y-3">
                                                        <div>
                                                            <div className="font-semibold text-sm">
                                                                {task.title}
                                                            </div>

                                                            <div className="text-xs text-muted-foreground">
                                                                {task.code}
                                                            </div>

                                                            <div className="text-sm">
                                                                <span>Mô tả:</span>
                                                                {task.description}
                                                            </div>
                                                        </div>
                                                        <div className="grid gap-2 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">
                                                                    Trạng thái
                                                                </span>
                                                                <span>
                                                                    {getStatusLabel(task.status)}
                                                                </span>
                                                            </div>

                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">
                                                                    Ưu tiên
                                                                </span>

                                                                <span
                                                                    className={cn(
                                                                        "px-2 py-0.5 rounded text-xs text-white",
                                                                        task.priority === "high" &&
                                                                        "bg-red-500",
                                                                        task.priority === "medium" &&
                                                                        "bg-yellow-500",
                                                                        task.priority === "low" &&
                                                                        "bg-green-500",
                                                                    )}
                                                                >
                                                                    {task.priority ?? "None"}
                                                                </span>
                                                            </div>

                                                            {task.startDate && task.dueDate && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground"> Thời gian: </span>
                                                                    <span>  {new Date(task.startDate).toLocaleDateString("vi-VN")} </span>
                                                                    <span>-</span>
                                                                    <span>{new Date(task.dueDate).toLocaleDateString("vi-VN")}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </HoverCardContent>
                                            </HoverCard>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}

                {/* Empty state */}
                {assigneeGroups.length === 0 && (
                    <div className="flex items-center justify-center p-8 text-gray-500">
                        Không có công việc nào để hiển thị
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs p-4 border-t bg-gray-50 rounded-b-xl">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-300 rounded"></div>
                    <span>Việc cần làm</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span>Đang thực hiện</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span>Chờ xét duyệt</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Hoàn thành</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>Hủy</span>
                </div>
                <div className="flex items-center gap-2">
                    <p>Ưu tiên:</p>
                    <div className="w-2 h-2 ring-2 ring-red-600"></div>
                    <span>Cao</span>
                    <div className="w-2 h-2 ring-2 ring-yellow-600"></div>
                    <span>Trung bình</span>
                    <div className="w-2 h-2 ring-2 ring-red-600"></div>
                    <span>Thấp</span>
                </div>
            </div>
        </div>
    );
}
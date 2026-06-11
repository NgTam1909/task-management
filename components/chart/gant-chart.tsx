"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Task } from "@/types/task";

interface AssigneeGroup {
    assignee: string;
    taskCount: number;
    tasks: Task[];
}

export default function GanttChart({ tasks }: { tasks: Task[] }) {
    const router = useRouter();
    const { assigneeGroups, dateRange, dayColumns } = useMemo(() => {
        if (!tasks || tasks.length === 0) {
            return { assigneeGroups: [], dateRange: { start: new Date(), end: new Date() }, dayColumns: [] };
        }

        // Nhóm task theo assignees
        const groupMap = new Map<string, Task[]>();

        tasks.forEach((task) => {
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

        tasks.forEach((task) => {
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
            minDate.setDate(minDate.getDate() - 2);
            maxDate.setDate(maxDate.getDate() + 2);
        }

        // Tạo danh sách các ngày
        const dayColumns: Date[] = [];
        for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
            dayColumns.push(new Date(d));
        }

        // Sắp xếp theo số lượng task (giảm dần)
        const assigneeGroups: AssigneeGroup[] = Array.from(groupMap.entries())
            .map(([assignee, tasks]) => ({
                assignee,
                taskCount: tasks.length,
                tasks: tasks.sort((a, b) => {
                    // Sắp xếp task: done cuối, inprogress đầu
                    if (a.status === "done" && b.status !== "done") return 1;
                    if (a.status !== "done" && b.status === "done") return -1;
                    return 0;
                }),
            }))
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case "done":
                return "bg-green-500";
            case "inprogress":
                return "bg-blue-500";
            case "pending_review":
                return "bg-yellow-500";
            case "cancelled":
                return "bg-red-500";
            default:
                return "bg-gray-400";
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    };

    return (
        <div className="overflow-x-auto border rounded-xl bg-white p-4">
            <div className="min-w-max">
                {/* Header với tiêu đề và cột ngày */}
                <div className="flex sticky top-0 z-20 bg-white border-b">
                    <div className="w-48 flex-shrink-0 px-4 py-3 font-semibold border-r bg-gray-50">
                        Thành viên (KPI)
                    </div>
                    <div className="flex">
                        {dayColumns.map((day, idx) => (
                            <div
                                key={idx}
                                className="w-16 flex-shrink-0 px-2 py-3 text-center text-xs font-medium border-r bg-gray-50"
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
                            <div className="w-48 flex-shrink-0 px-4 py-3 border-r font-semibold text-sm">
                                <div className="flex items-center justify-between">
                                    <span>{group.assignee}</span>
                                    <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                                        {group.taskCount}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-1">
                                {dayColumns.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className="w-16 flex-shrink-0 border-r bg-blue-50"
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Task rows for this assignee */}
                        {group.tasks.map((task) => {
                            const { left, width } = getTaskPosition(task);
                            return (
                                <div key={task.id} className="flex border-b hover:bg-gray-50 transition-colors">
                                    <div className="w-48 flex-shrink-0 px-4 py-3 border-r text-xs">
                                        <div className="font-medium truncate">{task.code}</div>
                                        <div className="text-gray-500 truncate">{task.title}</div>
                                    </div>
                                    <div className="flex-1 flex relative">
                                        {dayColumns.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className="w-16 flex-shrink-0 border-r relative h-16"
                                            />
                                        ))}

                                        {/* Task bar - absolutely positioned */}
                                        {width > 0 && (
                                            <div
                                                onClick={() => {
                                                    if (task.projectId) {
                                                        router.push(`/project/${task.projectId}/tasks?taskId=${task.id}`)
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if ((e.key === 'Enter' || e.key === ' ') && task.projectId) {
                                                        e.preventDefault()
                                                        router.push(`/project/${task.projectId}/tasks?taskId=${task.id}`)
                                                    }
                                                }}
                                                role="button"
                                                tabIndex={0}
                                                className={cn(
                                                    "absolute h-12 rounded-md flex items-center px-2 text-xs text-white shadow-sm transition-all hover:shadow-lg hover:scale-105 top-2 bottom-2 cursor-pointer",
                                                    getStatusColor(task.status),
                                                    task.priority === "high" && "ring-2 ring-red-600"
                                                )}
                                                style={{
                                                    left: `calc(${left}% + 4px)`,
                                                    width: `calc(${width}% - 8px)`,
                                                }}
                                                title={`${task.title} (${task.status}) - Click để xem chi tiết`}
                                            >
                                                <span className="truncate">{task.code}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
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
                    <div className="w-2 h-2 ring-2 ring-red-600"></div>
                    <span>Ưu tiên cao</span>
                </div>
            </div>
        </div>
    );
}
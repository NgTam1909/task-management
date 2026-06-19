import { useMemo } from "react";
import { Task } from "@/types/task";

export interface TaskLane {
    tasks: Task[];
}

export interface AssigneeGroup {
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

export function useGanttChart(tasks: Task[]) {
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

    const formatDate = (date: Date) =>
        date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
        });

    return {
        assigneeGroups,
        dayColumns,
        getTaskPosition,
        getStatusLabel,
        getStatusColor,
        formatDate,
    };
}
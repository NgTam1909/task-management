"use client";

import { cn } from "@/lib/utils";

export default function GanttChart({ tasks }: { tasks: any[] }) {
    // Logic lấy danh sách ngày (ví dụ 7 ngày tới)
    const days = Array.from({ length: 7 }, (_, i) => i);

    return (
        <div className="overflow-x-auto border rounded-xl bg-white p-4">
            <div className="grid grid-cols-[150px_repeat(7,1fr)] gap-2">
                {/* Header */}
                <div className="font-bold p-2">Thành viên</div>
                {days.map(d => <div key={d} className="text-center text-sm font-medium">T{d + 1}</div>)}

                {/* Rows */}
                {tasks.map((task) => (
                    <div key={task.id} className="contents group">
                        <div className="p-2 truncate text-sm border-b">{task.assignee}</div>
                        <div className="col-span-7 flex items-center relative h-10 border-b">
                            {/* Đoạn thanh Task */}
                            <div
                                className={cn(
                                    "absolute h-6 rounded-md flex items-center px-2 text-xs text-white",
                                    task.status === 'done' ? "bg-green-500" : "bg-blue-500",
                                    task.priority === 'high' && "border-2 border-red-500"
                                )}
                                style={{ left: '10%', width: '30%' }} // Tính toán dựa trên ngày
                            >
                                {task.title}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
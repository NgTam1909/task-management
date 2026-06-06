"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Task, TaskStatus } from "@/types/task";
import { TaskCard } from "./task-card";

interface Props {
    title: string;
    status: TaskStatus;
    tasks: Task[];
    isDragOver?: boolean;
    onTaskDrop?: (status: TaskStatus, event: React.DragEvent<HTMLDivElement>) => void;
    onTaskDragOver?: (status: TaskStatus, event: React.DragEvent<HTMLDivElement>) => void;
    onTaskDragLeave?: (status: TaskStatus, event: React.DragEvent<HTMLDivElement>) => void;
    onTaskDragStart?: (task: Task, event: React.DragEvent<HTMLDivElement>) => void;
    onTaskDragEnd?: (task: Task, event: React.DragEvent<HTMLDivElement>) => void;
}

export function KanbanColumn({
                                 title,
                                 status,
                                 tasks,
                                 isDragOver,
                                 onTaskDrop,
                                 onTaskDragOver,
                                 onTaskDragLeave,
                                 onTaskDragStart,
                                 onTaskDragEnd,
                             }: Props) {
    return (
        <div
            className={`flex flex-col bg-muted/40 rounded-xl p-4 w-[320px] shrink-0 border transition ${
                isDragOver ? "border-primary/70 bg-primary/5" : "border-transparent"
            }`}
            onDragOver={(event) => onTaskDragOver?.(status, event)}
            onDragLeave={(event) => onTaskDragLeave?.(status, event)}
            onDrop={(event) => onTaskDrop?.(status, event)}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">
                    {title}{" "}
                    <span className="text-muted-foreground ml-1">
            {tasks.length}
          </span>
                </h3>
            </div>

            {/* Tasks */}
            <ScrollArea className="h-110 pr-2">
                {tasks.map((task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        draggable
                        onDragStart={onTaskDragStart}
                        onDragEnd={onTaskDragEnd}
                    />
                ))}
            </ScrollArea>
        </div>
    );
}

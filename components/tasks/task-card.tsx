"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "lucide-react";
import { Task } from "@/types/task";
import { TaskDetail } from "./task-detail";
import { Suspense } from "react";

interface Props {
    task: Task;
    draggable?: boolean;
    onDragStart?: (task: Task, event: React.DragEvent<HTMLDivElement>) => void;
    onDragEnd?: (task: Task, event: React.DragEvent<HTMLDivElement>) => void;
}

function TaskCardContent({ task, draggable, onDragStart, onDragEnd }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const isOpen = searchParams.get("taskId") === task.id

    const handleOpenChange = (open: boolean) => {
        const params = new URLSearchParams(searchParams.toString())

        if (open) {
            params.set("taskId", task.id)
        } else {
            params.delete("taskId")
        }

        const query = params.toString()
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Card
                    className="mb-3 hover:shadow-md transition cursor-pointer"
                    draggable={draggable}
                    onDragStart={(event) => onDragStart?.(task, event)}
                    onDragEnd={(event) => onDragEnd?.(task, event)}
                >
                    <CardContent className="p-4 space-y-3">
                        {/* Code */}
                        <p className="text-xs text-muted-foreground">{task.code}</p>

                        {/* Title */}
                        <h4 className="font-medium leading-tight">{task.title}</h4>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2">
                                {task.priority && (
                                    <Badge
                                        variant={
                                            task.priority === "high"
                                                ? "destructive"
                                                : task.priority === "medium"
                                                    ? "default"
                                                    : "secondary"
                                        }
                                    >
                                        {task.priority}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {task.startDate && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Calendar size={14} />
                                        {task.startDate}
                                    </div>
                                )}

                                {task.dueDate && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Calendar size={14} />
                                        {task.dueDate}
                                    </div>
                                )}

                        {task.assignees && task.assignees.length > 0 && (
                            <Avatar className="h-6 w-6">
                                <AvatarFallback>
                                    {task.assignees[0].charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                        )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Chi tiết công việc</DialogTitle>
                </DialogHeader>
                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                    <TaskDetail task={task} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
export function TaskCard(props: Props) {
    return (
        <Suspense fallback={null}>
            <TaskCardContent {...props} />
        </Suspense>
    )
}
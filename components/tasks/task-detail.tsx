"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import {
    taskDetailPriorityOptions,
} from "@/constants/task-detail"
import { TaskSubtasks } from "@/components/tasks/task-subtasks"
import { useTaskDetail } from "@/hooks/useTaskDetail"
import { Task } from "@/types/task"
import {TaskProperty} from "@/components/tasks/task-property";
import {TaskComment} from "@/components/tasks/task-comment";

type TaskDetailProps = {
    task: Task
}

const getPriorityBadgeVariant = (priority?: string) => {
    if (priority === "high") return "destructive" as const
    if (priority === "medium") return "default" as const
    return "secondary" as const
}

export function TaskDetail({ task }: TaskDetailProps) {
    const {
        titleValue,
        descriptionValue,
        priorityValue,
        isEditingTitle,
        isEditingDescription,
        saveError,
        setTitleValue,
        setDescriptionValue,
        setIsEditingTitle,
        setIsEditingDescription,
        handleTitleBlur,
        handleDescriptionBlur,
        handlePriorityChange,
    } = useTaskDetail(task)

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-muted-foreground">
                        {task.code}
                    </Badge>

                    <Badge variant="secondary">
                        {task.status}
                    </Badge>

                    <Select
                        value={priorityValue}
                        onValueChange={(value) =>
                            void handlePriorityChange(
                                value as "low" | "medium" | "high" | ""
                            )
                        }
                    >
                        <SelectTrigger className="h-8 w-33 border-0 px-0 shadow-none focus:ring-0">
                            <Badge variant={getPriorityBadgeVariant(priorityValue)}>
                                <SelectValue placeholder="None" />
                            </Badge>
                        </SelectTrigger>

                        <SelectContent>
                            {taskDetailPriorityOptions.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    {!isEditingTitle ? (
                        <button
                            type="button"
                            className="text-left text-xl font-semibold hover:text-foreground"
                            onClick={() => setIsEditingTitle(true)}
                        >
                            {titleValue || "Chưa có tiêu đề"}
                        </button>
                    ) : (
                        <Input
                            value={titleValue}
                            onChange={(e) =>
                                setTitleValue(e.target.value)
                            }
                            onBlur={() => {
                                setIsEditingTitle(false)
                                void handleTitleBlur()
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    setIsEditingTitle(false)
                                    void handleTitleBlur()
                                }
                            }}
                            autoFocus
                            className="text-xl font-semibold"
                        />
                    )}
                </div>

                <div>
                    {!isEditingDescription ? (
                        <button
                            type="button"
                            className="min-h-6 text-left text-sm text-muted-foreground hover:text-foreground"
                            onClick={() =>
                                setIsEditingDescription(true)
                            }
                        >
                            {descriptionValue || "Chưa có mô tả"}
                        </button>
                    ) : (
                        <Textarea
                            value={descriptionValue}
                            onChange={(e) =>
                                setDescriptionValue(e.target.value)
                            }
                            onBlur={() => {
                                setIsEditingDescription(false)
                                void handleDescriptionBlur()
                            }}
                            autoFocus
                        />
                    )}
                </div>
            </div>

            <TaskSubtasks parentTask={task} />

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">
                        Chi tiết
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <TaskProperty task={task}/>
                    {saveError && <div className="text-xs text-red-500">{saveError}</div>}
                    <TaskComment task={task}/>
                </CardContent>
            </Card>
        </div>
    )
}
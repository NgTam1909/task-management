import mongoose from "mongoose"

export enum TaskStatus {
    BACKLOG = "backlog",
    TODO = "todo",
    IN_PROGRESS = "inprogress",
    PENDING_REVIEW = "pending_review",
    DONE = "done",
    CANCELLED = "cancelled",
}

export enum PriorityLevel {
    NONE = "none",
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
}
export interface Task {
    id: string;
    projectId?: string;
    parentId?: string;
    code: string;
    title: string;
    status: TaskStatus;
    description?: string;
    creatorId: string;
    assignees?: string[];
    assigneeIds?: string[];
    labels?: string[];
    priority?: "low" | "medium" | "high";
    startDate?: string;
    dueDate?: string;
    startDateValue?: string;
    dueDateValue?: string;
    estimate?: number;
    createdAt?: string;
    updatedAt?: string;
}
export type LeanUser = {
    _id: mongoose.Types.ObjectId
    firstName?: string
    lastName?: string
    email?: string
    address?: string

}
export type TaskSubtaskItem = {
    id: string
    status: string
    code: string
    assigneesText: string
}

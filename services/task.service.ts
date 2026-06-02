import {GET_METHOD, PATCH_METHOD, POST_METHOD} from "@/lib/req"
import { CreateTaskInput, UpdateTaskInput } from "@/lib/validations/task.validation"
import { ActivityLog } from "@/types/activity-log"
import {  ApiTask } from "@/types/project"
import { TaskComment } from "@/types/task-detail"
import {Task} from "@/types/task";

export async function createTask(data: CreateTaskInput) {
    return POST_METHOD("/api/task", data)
}

export async function updateTask(taskId: string, data: UpdateTaskInput) {
    return PATCH_METHOD(`/api/task/${taskId}`, data)
}

export async function getTaskAuditLogs(taskId: string) {
    return GET_METHOD(`/api/activity/task/${taskId}`) as Promise<{ logs?: ActivityLog[] }>
}

export async function getTaskComments(taskId: string) {
    return GET_METHOD(`/api/task/${taskId}/comments`) as Promise<{ comments?: TaskComment[] }>
}

export async function getTaskSubtasks(taskId: string) {
    return GET_METHOD(`/api/task/${taskId}/subtasks`) as Promise<{ subtasks?: ApiTask[] }>
}

export async function createTaskComment(
    taskId: string,
    content: string,
    mentions: string[] = [],
    parentCommentId?: string | null
) {
    return POST_METHOD(
        `/api/task/${taskId}/comments`,
        {
            content,
            mentions,
            parentCommentId,
        }
    )
}

/**
 * Lấy danh sách task của user hiện tại (công việc của tôi)
 * @param filters - Các bộ lọc tùy chọn
 * @returns Promise<{ tasks: Task[] }>
 */
export async function getMyTasks(filters?: {
    status?: string[];
    priority?: string[];
    dueDateBefore?: string;
    dueDateAfter?: string;
    search?: string;
}) {
    let url = "/api/tasks/my-tasks";

    if (filters) {
        const params = new URLSearchParams();
        if (filters.status?.length) params.append('status', filters.status.join(','));
        if (filters.priority?.length) params.append('priority', filters.priority.join(','));
        if (filters.dueDateBefore) params.append('dueDateBefore', filters.dueDateBefore);
        if (filters.dueDateAfter) params.append('dueDateAfter', filters.dueDateAfter);
        if (filters.search) params.append('search', filters.search);

        if (params.toString()) {
            url += `?${params.toString()}`;
        }
    }

    return GET_METHOD(url) as Promise<{ tasks: Task[] }>;
}

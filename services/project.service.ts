import { DELETE_METHOD, GET_METHOD } from "@/lib/req"
import {ApiResponse, Project} from "@/types/project";
import {AssigneeResponse} from "@/types/task-detail";

export async function getProjectsService(): Promise<Project[]> {
    const data = (await GET_METHOD("/api/projects")) as Project[]
    return Array.isArray(data) ? data : []
}

export async function deleteProjectService(projectId: string) {
    return DELETE_METHOD(`/api/projects/${projectId}`)
}
export async function getProjectMentionUsers(
    projectId: string
) {
    return GET_METHOD(
        `/api/projects/${projectId}/mentions`
    )
}
export async function getProjectTasks(projectId: string) {
    return GET_METHOD(`/api/projects/${projectId}/tasks`) as Promise<ApiResponse>
}
export async function getTaskAssignees(projectId: string) {
    return GET_METHOD(`/api/projects/${projectId}/assignees`) as Promise<AssigneeResponse>
}
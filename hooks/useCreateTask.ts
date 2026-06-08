// hooks/useTaskForm.ts
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createTaskSchema, CreateTaskInput } from "@/lib/validations/task.validation"
import { createTask as createTaskRequest } from "@/services/task.service"
import {TaskStatus, PriorityLevel, Task} from "@/types/task"
import type { AssigneeOption, AssigneeResponse } from "@/types/task-detail"
import {getTaskAssignees} from "@/services/project.service";

type UseTaskFormProps = {
    projectId: string
    parentId?: string
    onSuccess?: (task?: Task) => void
}

export function useCreateTask({ projectId, parentId, onSuccess }: UseTaskFormProps) {
    // State from useCreateTask
    const [loading, setLoading] = useState(false)
    const [createError, setCreateError] = useState<string | null>(null)

    // State from useAssignees
    const [assigneeOptions, setAssigneeOptions] = useState<AssigneeOption[]>([])
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [currentUserRole, setCurrentUserRole] = useState<AssigneeResponse["currentUserRole"] | null>(null)
    const [loadingAssignees, setLoadingAssignees] = useState(true)

    const defaultAssignee = currentUserRole === "Member" && currentUserId ? [currentUserId] : []
    const canAssignOthers = currentUserRole !== "Member"

    // Form
    const form = useForm<CreateTaskInput>({
        resolver: zodResolver(createTaskSchema),
        defaultValues: {
            title: "",
            description: "",
            status: TaskStatus.BACKLOG,
            priority: PriorityLevel.NONE,
            projectId,
            parentId,
            startDate: "",
            dueDate: "",
            estimate: undefined,
            assignees: defaultAssignee,
        },
    })

    // Load assignees
    useEffect(() => {
        let active = true

        const loadAssignees = async () => {
            try {
                const data = await getTaskAssignees(projectId)
                if (!active) return
                setAssigneeOptions(Array.isArray(data.assignees) ? data.assignees : [])
                setCurrentUserId(data.currentUserId)
                setCurrentUserRole(data.currentUserRole)
            } catch {
                if (active) {
                    setAssigneeOptions([])
                    setCurrentUserId(null)
                    setCurrentUserRole(null)
                }
            } finally {
                setLoadingAssignees(false)
            }
        }

        void loadAssignees()
        return () => { active = false }
    }, [projectId])

    // Update form when projectId/parentId changes
    useEffect(() => {
        form.setValue("projectId", projectId)
        form.setValue("parentId", parentId)
    }, [form, projectId, parentId])

    // Update assignees when role changes
    useEffect(() => {
        if (currentUserRole === "Member" && currentUserId) {
            form.setValue("assignees", [currentUserId])
        } else {
            form.setValue("assignees", [])
        }
    }, [currentUserRole, currentUserId, form])

    // Create task function
    const createTask = async (data: CreateTaskInput): Promise<Task | null> => {
        try {
            setLoading(true)
            setCreateError(null)
            const result = await createTaskRequest(data)
            return result as Task
        } catch (err: unknown) {
            const payload = (err as { response?: { data?: { message?: string } } })?.response?.data
            const message = payload?.message ?? "Tạo thất bại!"
            setCreateError(message)
            return null
        } finally {
            setLoading(false)
        }
    }

    // Submit handler
    const onSubmit = async (data: CreateTaskInput) => {
        const createdTask = await createTask(data)
        if (createdTask) {
            form.reset({
                title: "",
                description: "",
                status: TaskStatus.BACKLOG,
                priority: PriorityLevel.NONE,
                projectId,
                parentId,
                startDate: "",
                dueDate: "",
                estimate: undefined,
                assignees: defaultAssignee,
            })

            window.dispatchEvent(new CustomEvent('task:created', {
                detail: createdTask
            }))
            onSuccess?.(createdTask)
        }
    }

    return {
        form,
        createTask,
        loading: loading || loadingAssignees,
        error: createError,
        assigneeOptions,
        canAssignOthers,
        onSubmit: form.handleSubmit(onSubmit),
    }
}
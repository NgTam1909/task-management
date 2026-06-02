"use client"

import { useRef, useState } from "react"
import { Task } from "@/types/task"
import { UseTaskDetailResult } from "@/types/task-detail"
import { useTaskDetailEffects } from "./useTaskDetailEffect"
import { useTaskDetailHandlers } from "./useTaskDetailHandlers"
import {ActivityUser} from "@/types/activity-log";

export function useTaskDetail(task: Task): UseTaskDetailResult {
    const [isOpen, setIsOpen] = useState(false)
    const [availableUsers, setAvailableUsers] = useState([])
    const [selectedUsers, setSelectedUsers] = useState(task.assigneeIds || [])
    const [currentUserRole, setCurrentUserRole] = useState(null)

    const [titleValue, setTitleValue] = useState(task.title ?? "")
    const [descriptionValue, setDescriptionValue] = useState(task.description ?? "")
    const [priorityValue, setPriorityValue] = useState(task.priority ?? "")
    const [startDateValue, setStartDateValue] = useState(task.startDateValue ?? "")
    const [dueDateValue, setDueDateValue] = useState(task.dueDateValue ?? "")
    const [estimateValue, setEstimateValue] = useState(
        task.estimate != null ? String(task.estimate) : ""
    )

    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [isEditingDescription, setIsEditingDescription] = useState(false)
    const [isEditingEstimate, setIsEditingEstimate] = useState(false)

    const [auditLogs, setAuditLogs] = useState([])
    const [auditLoading, setAuditLoading] = useState(false)
    const [auditError, setAuditError] = useState<string | null>(null)

    const [comments, setComments] = useState([])
    const [commentsLoading, setCommentsLoading] = useState(false)
    const [commentsError, setCommentsError] = useState<string | null>(null)
    const [mentionUsers, setMentionUsers] = useState<ActivityUser[]>([])
    const [mentionedUsers, setMentionedUsers] = useState<
        {
            id: string
            name: string
        }[]
    >([])
    const [commentValue, setCommentValue] = useState("")
    const [replyTo, setReplyTo] = useState<string | null>(
        null
    )
    const [saveError, setSaveError] = useState<string | null>(null)

    const dropdownRef = useRef<HTMLDivElement>(null)
    const startDateRef = useRef<HTMLInputElement>(null)
    const dueDateRef = useRef<HTMLInputElement>(null)

    const state = {
        isOpen,
        setIsOpen,
        availableUsers,
        setAvailableUsers,
        selectedUsers,
        setSelectedUsers,
        currentUserRole,
        setCurrentUserRole,

        titleValue,
        setTitleValue,
        descriptionValue,
        setDescriptionValue,
        priorityValue,
        setPriorityValue,
        startDateValue,
        setStartDateValue,
        dueDateValue,
        setDueDateValue,
        estimateValue,
        setEstimateValue,

        isEditingTitle,
        setIsEditingTitle,
        isEditingDescription,
        setIsEditingDescription,
        isEditingEstimate,
        setIsEditingEstimate,

        auditLogs,
        setAuditLogs,
        auditLoading,
        setAuditLoading,
        auditError,
        setAuditError,

        comments,
        setComments,
        commentsLoading,
        setCommentsLoading,
        commentsError,
        setCommentsError,
        mentionUsers,
        setMentionUsers,
        mentionedUsers,
        setMentionedUsers,
        replyTo,
        setReplyTo,

        commentValue,
        setCommentValue,
        saveError,
        setSaveError,

        dropdownRef,
        startDateRef,
        dueDateRef,
    }

    useTaskDetailEffects(task, state)

    const handlers = useTaskDetailHandlers(task, state)

    return {
        ...state,
        ...handlers,
    } as UseTaskDetailResult
}
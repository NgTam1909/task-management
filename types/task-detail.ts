import {ActivityLog, ActivityUser} from "@/types/activity-log"

export type AssigneeOption = {
    id: string
    name: string
    email?: string
    address?: string
}

export type AssigneeResponse = {
    currentUserId: string
    currentUserRole: "Admin" | "Leader" | "Member"
    assignees: AssigneeOption[]
}

export type TaskComment = {
    id: string
    parentCommentId?: string | null
    content: string
    createdAt: string
    user?: {
        id: string
        name: string
        email?: string | null
    } | null
    mentions?: {
        id: string
        name: string
    }[]
    replies?: TaskComment[]
}

export type TimelineItem =
    | {
          id: string
          kind: "audit"
          createdAt: string
          log: ActivityLog
      }
    | {
          id: string
          kind: "comment"
          createdAt: string
          comment: TaskComment
      }
export type UseTaskDetailResult = {
    isOpen: boolean
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
    availableUsers: AssigneeOption[]
    selectedUsers: string[]
    currentUserRole: AssigneeResponse["currentUserRole"] | null
    titleValue: string
    descriptionValue: string
    priorityValue: "low" | "medium" | "high" | ""
    startDateValue: string
    dueDateValue: string
    estimateValue: string

    isEditingTitle: boolean
    isEditingDescription: boolean
    isEditingEstimate: boolean
    setIsEditingTitle: React.Dispatch<React.SetStateAction<boolean>>
    setIsEditingDescription: React.Dispatch<React.SetStateAction<boolean>>
    setIsEditingEstimate: React.Dispatch<React.SetStateAction<boolean>>
    setTitleValue: React.Dispatch<React.SetStateAction<string>>
    setDescriptionValue: React.Dispatch<React.SetStateAction<string>>
    setEstimateValue: React.Dispatch<React.SetStateAction<string>>

    auditLogs: ActivityLog[]
    auditLoading: boolean
    auditError: string | null
    comments: TaskComment[]
    commentsLoading: boolean
    commentsError: string | null
    commentValue: string
    setCommentValue: React.Dispatch<React.SetStateAction<string>>
    mentionUsers: ActivityUser[]
    setMentionUsers: React.Dispatch<
        React.SetStateAction<ActivityUser[]>
    >
    mentionedUsers: {
        id: string
        name: string
    }[]
    setMentionedUsers: React.Dispatch<
        React.SetStateAction<{
                id: string
                name: string
            }[]>
    >
    replyTo: string | null
    setReplyTo: React.Dispatch<
        React.SetStateAction<string | null>
    >
    saveError: string | null
    dropdownRef: React.RefObject<HTMLDivElement | null>
    startDateRef: React.RefObject<HTMLInputElement | null>
    dueDateRef: React.RefObject<HTMLInputElement | null>
    timelineItems: TimelineItem[]
    handleSelectUser: (userId: string) => Promise<void>
    handleTitleBlur: () => Promise<void>
    handleDescriptionBlur: () => Promise<void>
    handlePriorityChange: (value: "low" | "medium" | "high" | "") => Promise<void>
    handleStartDateChange: (value: string) => Promise<void>
    handleDueDateChange: (value: string) => Promise<void>
    handleEstimateBlur: () => Promise<void>
    handleCommentSubmit: () => Promise<void>
}

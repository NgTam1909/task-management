export const taskDetailActionLabels: Record<string, string> = {
    CREATE_PROJECT: "Tạo project",
    UPDATE_PROJECT: "Cập nhật project",
    DELETE_PROJECT: "Xóa project",
    INVITE_MEMBER: "Mời thành viên",
    CHANGE_ROLE: "Đổi vai trò",
    CREATE_TASK: "Tạo task",
    UPDATE_TASK: "Cập nhật task",
    UPDATE_TASK_STATUS: "Cập nhật trạng thái",
    TASK_COMPLETED: "Task đã hoàn thành",
    TASK_CANCELLED: "Task đã bị hủy",
    TASK_DEADLINE_EXTENDED: "Gia hạn deadline",
    TASK_OVERDUE: "Task quá hạn",
}

export const taskDetailFieldLabels: Record<string, string> = {
    title: "Tiêu đề",
    description: "Mô tả",
    status: "Trạng thái",
    priority: "Ưu tiên",
    labels: "Nhãn",
    estimate: "Estimate",
    assignees: "Người thực hiện",
    startDate: "Ngày bắt đầu",
    dueDate: "Ngày kết thúc",
    projectId: "Project",
}

export const taskDetailPriorityOptions = [
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
] as const


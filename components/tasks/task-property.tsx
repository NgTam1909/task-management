"use client"

import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useTaskDetail } from "@/hooks/useTaskDetail"
import { Task } from "@/types/task"
type TaskDetailProps = {
    task: Task
}
export function TaskProperty({ task }: TaskDetailProps) {
    const {
        isOpen,
        setIsOpen,
        availableUsers,
        selectedUsers,
        startDateValue,
        dueDateValue,
        estimateValue,
        isEditingEstimate,
        saveError,
        dropdownRef,
        startDateRef,
        dueDateRef,
        setEstimateValue,
        setIsEditingEstimate,
        handleSelectUser,
        handleStartDateChange,
        handleDueDateChange,
        handleEstimateBlur,
    } = useTaskDetail(task)

    const disableAssigneeButton = availableUsers.length === 0

    const getAssigneeNames = () => {
        if (!selectedUsers.length) return "Chưa nhận"

        return selectedUsers
            .map((assigneeId) => {
                const user = availableUsers.find((item) => item.id === assigneeId)
                return user?.name ?? assigneeId
            })
            .join(", ")
    }

    return (
          <div className="space-y-4">
        <div className="relative flex items-start justify-between" ref={dropdownRef}>
                        <span className="text-sm text-muted-foreground">Người thực hiện</span>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsOpen(!isOpen)}
                                className="flex cursor-pointer items-center gap-2 rounded-md p-1 text-sm transition-colors hover:bg-accent"
                                disabled={disableAssigneeButton}
                            >
                                <span>{getAssigneeNames()}</span>
                            </button>

                            {isOpen && (
                                <div className="absolute right-0 z-50 mt-2 w-64 rounded-md border bg-popover shadow-lg">
                                    <div className="max-h-64 overflow-y-auto py-1">
                                        {availableUsers.length > 0 ? (
                                            availableUsers.map((user) => (
                                                <div
                                                    key={user.id}
                                                    onClick={() => void handleSelectUser(user.id)}
                                                    className="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-accent"
                                                >
                                                    <div className="flex-1">
                                                        <span className="text-sm">{user.name}</span>
                                                        {user.email && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {user.email}
                                                            </p>
                                                        )}
                                                        {user.position && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {user.position}
                                                            </p>
                                                        )}
                                                        {user.skills && user.skills.length > 0 && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {user.skills.join(", ")}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-center text-sm text-muted-foreground">
                                                Chưa có người làm
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-start justify-between">
                        <span className="text-sm text-muted-foreground">Ngày bắt đầu</span>
                        <div className="flex items-center gap-2 text-sm">
                            <button
                                type="button"
                                className="hover:text-foreground"
                                onClick={() => startDateRef.current?.showPicker?.()}
                            >
                                {startDateValue || "N/A"}
                            </button>
                            <Input
                                ref={startDateRef}
                                type="date"
                                className="pointer-events-none absolute h-0 w-0 opacity-0"
                                value={startDateValue}
                                max={dueDateValue || undefined}
                                onChange={(e) => void handleStartDateChange(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-start justify-between">
                        <span className="text-sm text-muted-foreground">Ngày kết thúc</span>
                        <div className="flex items-center gap-2 text-sm">
                            <button
                                type="button"
                                className="hover:text-foreground"
                                onClick={() => dueDateRef.current?.showPicker?.()}
                            >
                                {dueDateValue || "N/A"}
                            </button>
                            <Input
                                ref={dueDateRef}
                                type="date"
                                className="pointer-events-none absolute h-0 w-0 opacity-0"
                                value={dueDateValue}
                                min={startDateValue || undefined}
                                onChange={(e) => void handleDueDateChange(e.target.value)}
                            />
                        </div>
                    </div>

                    <Separator />

                    <div className="flex items-start justify-between">
                        <span className="text-sm text-muted-foreground">Giới hạn (h)</span>
                        <div className="flex items-center gap-2 text-sm">
                            {!isEditingEstimate ? (
                                <button
                                    type="button"
                                    className="hover:text-foreground"
                                    onClick={() => setIsEditingEstimate(true)}
                                >
                                    {estimateValue ? `${estimateValue}h` : "0"}
                                </button>
                            ) : (
                                <Input
                                    type="number"
                                    min={0}
                                    className="h-8 w-30"
                                    value={estimateValue}
                                    onChange={(e) => setEstimateValue(e.target.value)}
                                    onBlur={() => {
                                        setIsEditingEstimate(false)
                                        void handleEstimateBlur()
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            setIsEditingEstimate(false)
                                            void handleEstimateBlur()
                                        }
                                    }}
                                    autoFocus
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex items-start justify-between">
                        <span className="text-sm text-muted-foreground">Nhãn</span>
                        <span className="text-sm">
                            {task.labels && task.labels.length > 0 ? task.labels.join(", ") : "Không có"}
                        </span>
                    </div>

                    <Separator />
                    <div className="flex items-start justify-between">
                        <span className="text-sm text-muted-foreground">Ngày tạo:</span>
                        <span className="text-sm">{task.createdAt ?? "N/A"}</span>
                    </div>

                    <div className="flex items-start justify-between">
                        <span className="text-sm text-muted-foreground">Cập nhật gần nhất:</span>
                        <span className="text-sm">{task.updatedAt ?? "N/A"}</span>
                    </div>

</div>
    )
}
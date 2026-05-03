import Task, { ITask} from "@/models/task.model"
import ActivityLog, { ActivityAction } from "@/models/activityLog.model"
import { getTaskOverDue } from "@/lib/overDue"
import { TaskStatus } from "@/types/task"

export async function syncTaskOverdue(task: ITask) {
    if (
        task.status === TaskStatus.DONE ||
        task.status === TaskStatus.CANCELLED
    ) {
        return
    }

    if (task.overDue) {
        return
    }

    const isOverdue = getTaskOverDue(task, new Date()).isOverdue

    if (!isOverdue) {
        return
    }

    await Task.updateOne(
        { _id: task._id },
        {
            $set: {
                overDue: true,
            },
        }
    )

    await ActivityLog.create({
        userId: task.creatorId, // hoặc system user nếu bạn muốn
        projectId: task.projectId,
        entityType: "Task",
        entityId: task._id,
        action: ActivityAction.TASK_OVERDUE,
        oldValue: {
            overDue: false,
        },
        newValue: {
            overDue: true,
        },
    })
}
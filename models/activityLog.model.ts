import mongoose, { Schema, Document, Model } from "mongoose";


export enum ActivityAction {
    CREATE_PROJECT = "CREATE_PROJECT",
    UPDATE_PROJECT = "UPDATE_PROJECT",
    DELETE_PROJECT = "DELETE_PROJECT",

    INVITE_MEMBER = "INVITE_MEMBER",
    CHANGE_ROLE = "CHANGE_ROLE",
    REMOVE_MEMBER = "REMOVE_MEMBER",
    JOIN_PROJECT = "JOIN_PROJECT",

    CREATE_TASK = "CREATE_TASK",
    UPDATE_TASK = "UPDATE_TASK",
    UPDATE_TASK_STATUS = "UPDATE_TASK_STATUS",

    TASK_COMPLETED = "TASK_COMPLETED",
    TASK_CANCELLED = "TASK_CANCELLED",

    TASK_OVERDUE = "TASK_OVERDUE",
    TASK_DEADLINE_EXTENDED = "TASK_DEADLINE_EXTENDED",
}

export interface IActivityLog extends Document {
    userId: mongoose.Types.ObjectId;
    projectId: mongoose.Types.ObjectId;
    entityType: "Project" | "Task" | "Invite";
    entityId?: mongoose.Types.ObjectId;
    action: ActivityAction;
    oldValue?: unknown;
    newValue?: unknown;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}


const ActivityLogSchema = new Schema<IActivityLog>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },

        entityType: {
            type: String,
            enum: ["Project", "Task", "Invite"],
            required: true,
        },

        entityId: {
            type: Schema.Types.ObjectId,
        },

        action: {
            type: String,
            enum: Object.values(ActivityAction),
            required: true,
        },

        oldValue: {
            type: Schema.Types.Mixed,
        },

        newValue: {
            type: Schema.Types.Mixed,
        },

        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);


ActivityLogSchema.index({ projectId: 1, createdAt: -1 });
ActivityLogSchema.index({ entityId: 1 });
ActivityLogSchema.index({ userId: 1 });

const ActivityLog: Model<IActivityLog> = mongoose.models.ActivityLog || mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);

export default ActivityLog;

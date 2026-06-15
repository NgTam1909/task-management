import mongoose, { Schema, Document, Model } from "mongoose";
import {PriorityLevel, TaskStatus} from "@/types/task";


export interface ITaskComment {
    _id?: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    content: string;
    mentions: mongoose.Types.ObjectId [];
    parentCommentId?: mongoose.Types.ObjectId | null;
    createdAt: Date;
}

export interface ITask extends Document {
    code: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: PriorityLevel;
    projectId: mongoose.Types.ObjectId;
    creatorId: mongoose.Types.ObjectId; //người tạo task
    ownerId: mongoose.Types.ObjectId; // người chịu trách nhiệm
    assignees?: mongoose.Types.ObjectId[]; //Người thực hiện task
    labels?: string[];
    startDate?: Date;
    dueDate?: Date;
    estimate?: number;
    startedAt?: Date;
    completedAt?:Date;
    parentId?: mongoose.Types.ObjectId;
    comments?: ITaskComment[];
    resource?: mongoose.Types.ObjectId[];
    overDue: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/* =========================
   SCHEMA
========================= */

const TaskSchema = new Schema<ITask>(
    {
        code: {
            type: String,
            unique: true,
            sparse: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
        },

        status: {
            type: String,
            enum: Object.values(TaskStatus),
            default: TaskStatus.BACKLOG,
        },

        priority: {
            type: String,
            enum: Object.values(PriorityLevel),
            default: PriorityLevel.NONE,
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        creatorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        assignees: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        labels: [
            {
                type: String,
            },
        ],

        startDate: {
            type: Date,
        },

        dueDate: {
            type: Date,
        },
        completedAt: {
            type: Date,
        },

        estimate: {
            type: Number,
        },
        startedAt: {
            type: Date,
        },
        overDue: {
            type: Boolean,
            default: false,
        },
        parentId: {
            type: Schema.Types.ObjectId,
            ref: "Task",
        },

        comments: [
            {
                userId: {
                    type: Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                content: {
                    type: String,
                    required: true,
                    trim: true,
                },
                mentions: [
                    {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "User",
                    },
                ],
                parentCommentId: {
                    type: Schema.Types.ObjectId,
                    default: null,
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        resource: [
            {
                type: Schema.Types.ObjectId,
                ref: "Resource",
            },
        ],
    },
    {
        timestamps: true,
    }
);


TaskSchema.index({ status: 1 });
TaskSchema.index({ creatorId: 1 });
TaskSchema.index({ ownerId: 1 });
TaskSchema.index({ dueDate: 1 });

const Task: Model<ITask> =
    mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);

export default Task;

import mongoose, { Schema, Document, Model } from "mongoose";
import {ProjectRole} from "@/types/project";
export interface IProjectMember {
    userId: mongoose.Types.ObjectId;
    role: ProjectRole;
    joinedAt: Date;
}

export interface IProject extends Document {
    title: string;
    projectId: string;
    description?: string;
    owner: IProjectMember;
    members: IProjectMember[];
    isPublic: boolean;
    isActive: boolean;
    startDate?: Date;
    endDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        projectId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },

        description: String,
        owner: {
            userId: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            role: {
                type: String,
                enum: Object.values(ProjectRole),
                default: ProjectRole.ADMIN,
            },
            joinedAt: {
                type: Date,
                default: Date.now,
            },

        },
        members: [
            {
                userId: {
                    type: Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                role: {
                    type: String,
                    enum: Object.values(ProjectRole),
                    default: ProjectRole.MEMBER,
                },
                joinedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        isPublic: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Lấy role của user trong project
ProjectSchema.methods.getRole = function (
    userId: mongoose.Types.ObjectId
): ProjectRole | null {
    const member = this.members.find((m: IProjectMember) =>
        m.userId.equals(userId)
    );

    return member ? member.role : null;
};

// Kiểm tra role cụ thể
ProjectSchema.methods.checkRole = function (
    userId: mongoose.Types.ObjectId,
    role: ProjectRole
): boolean {
    const userRole = this.getRole(userId);
    return userRole === role;
};


ProjectSchema.index({ "members.userId": 1 });
ProjectSchema.index({ title: "text" });

const Project: Model<IProject> =
    mongoose.models.Project ||
    mongoose.model<IProject>("Project", ProjectSchema);

export default Project;

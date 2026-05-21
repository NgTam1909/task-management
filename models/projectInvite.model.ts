import mongoose, { Schema, Document, Model } from "mongoose";
import {ProjectRole} from "@/types/project";

export interface IProjectInvite extends Document {
    projectId: mongoose.Types.ObjectId;
    email: string;
    invitedBy: mongoose.Types.ObjectId;
    role: ProjectRole;
    tokenHash: string;
    expiresAt: Date;
    acceptedAt?: Date;
    createdAt: Date;
}

const ProjectInviteSchema = new Schema<IProjectInvite>(
    {
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        invitedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        role: {
            type: String,
            enum: Object.values(ProjectRole),
            default: ProjectRole.MEMBER,
        },
        tokenHash: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true,
        },
        acceptedAt: {
            type: Date,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

ProjectInviteSchema.index({ projectId: 1, email: 1, acceptedAt: 1 });

const ProjectInvite: Model<IProjectInvite> =
    mongoose.models.ProjectInvite ||
    mongoose.model<IProjectInvite>("ProjectInvite", ProjectInviteSchema);

export default ProjectInvite;

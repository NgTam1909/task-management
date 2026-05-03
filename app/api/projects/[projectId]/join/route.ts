import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Project, { IProjectMember } from "@/models/project.model";
import {ProjectRole} from "@/types/project";
import ActivityLog, { ActivityAction } from "@/models/activityLog.model";
import {getUserIdFromRequest} from "@/lib/jwt";

async function findProject(projectId: string) {
    let project = await Project.findOne({ projectId, isActive: true });
    if (!project && mongoose.isValidObjectId(projectId)) {
        project = await Project.findById(projectId);
    }
    return project;
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        if (!projectId) {
            return NextResponse.json({ message: "Missing projectId" }, { status: 400 });
        }

        await connectDB();

        const project = await findProject(projectId);
        if (!project) {
            return NextResponse.json({ message: "Project not found" }, { status: 404 });
        }

        if (!project.isPublic) {
            return NextResponse.json({ message: "Dự án này là riêng tư" }, { status: 403 });
        }

        const userId = await getUserIdFromRequest(req);
        const isMember =
            !!userId &&
            (project.owner?.userId?.toString() === userId ||
                project.members?.some((m: IProjectMember) => m.userId?.toString() === userId));

        return NextResponse.json({
            projectId: project.projectId,
            title: project.title,
            isPublic: project.isPublic,
            isMember,
        });
    } catch {
        return NextResponse.json(
            { message: "Failed to load project" },
            { status: 500 }
        );
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { projectId } = await params;
        if (!projectId) {
            return NextResponse.json({ message: "Missing projectId" }, { status: 400 });
        }

        await connectDB();

        const project = await findProject(projectId);
        if (!project) {
            return NextResponse.json({ message: "Project not found" }, { status: 404 });
        }

        if (!project.isPublic) {
            return NextResponse.json({ message: "Dự án này là riêng tư" }, { status: 403 });
        }

        const isMember =
            project.owner?.userId?.toString() === userId ||
            project.members?.some((m: IProjectMember) => m.userId?.toString() === userId);

        if (!isMember) {
            project.members.push({
                userId: new mongoose.Types.ObjectId(userId),
                role: ProjectRole.MEMBER,
                joinedAt: new Date(),
            });
            await project.save();

            try {
                await ActivityLog.create({
                    userId: new mongoose.Types.ObjectId(userId),
                    projectId: project._id,
                    entityType: "Project",
                    entityId: project._id,
                    action: ActivityAction.JOIN_PROJECT,
                    metadata: {
                        projectId: project.projectId,
                        projectTitle: project.title,
                        affectedUserIds: [userId],
                    },
                });
            } catch {
                // ignore audit log errors
            }
        }

        return NextResponse.json({
            success: true,
            projectId: project.projectId,
            title: project.title,
        });
    } catch {
        return NextResponse.json({ message: "Failed to join project" }, { status: 500 });
    }
}

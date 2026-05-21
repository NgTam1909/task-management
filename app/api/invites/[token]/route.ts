import crypto from "crypto";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Project, { IProjectMember } from "@/models/project.model";
import {ProjectRole} from "@/types/project";
import ProjectInvite from "@/models/projectInvite.model";
import User from "@/models/user.model";
import ActivityLog, { ActivityAction } from "@/models/activityLog.model";
import {getUserIdFromRequest} from "@/lib/jwt";


function hashToken(rawToken: string) {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
}

async function findInvite(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    return ProjectInvite.findOne({
        tokenHash,
        acceptedAt: null,
        expiresAt: { $gt: new Date() },
    });
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        if (!token) {
            return NextResponse.json({ message: "Missing token" }, { status: 400 });
        }

        await dbConnect();

        const invite = await findInvite(token);
        if (!invite) {
            return NextResponse.json(
                { message: "Lời mời không hợp lệ hoặc quá hạn" },
                { status: 404 }
            );
        }

        const project = await Project.findById(invite.projectId).select(
            "title projectId isPublic"
        );
        if (!project) {
            return NextResponse.json({ message: "Không tìm thấy dự án" }, { status: 404 });
        }

        return NextResponse.json({
            projectTitle: project.title,
            projectId: project.projectId,
            email: invite.email,
            expiresAt: invite.expiresAt,
        });
    } catch {
        return NextResponse.json(
            { message: "Lời mời không thể tải" },
            { status: 500 }
        );
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { token } = await params;
        if (!token) {
            return NextResponse.json({ message: "Missing token" }, { status: 400 });
        }

        await dbConnect();

        const invite = await findInvite(token);
        if (!invite) {
            return NextResponse.json(
                { message: "Thư mời không hợp lệ hoặc đã hết hạn" },
                { status: 404 }
            );
        }

        const user = await User.findById(userId).select("email");
        if (!user) {
            return NextResponse.json({ message: "Không tìm thấy người dùng" }, { status: 404 });
        }
        if (user.email?.toLowerCase() !== invite.email?.toLowerCase()) {
            return NextResponse.json({
                success: false,
                forceLogout: true,
                message: "Địa chỉ email không khớp với thư mời. Đang chuyển sang giao diện đăng nhập ..."
            });
        }

        const project = await Project.findById(invite.projectId);
        if (!project) {
            return NextResponse.json({ message: "Không tìm thấy dự án" }, { status: 404 });
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
                    entityType: "Invite",
                    action: ActivityAction.JOIN_PROJECT,
                    metadata: {
                        projectId: project.projectId,
                        projectTitle: project.title,
                        affectedUserIds: [userId],
                        inviteEmail: invite.email,
                    },
                });
            } catch {
                // ignore audit log errors
            }
        }

        invite.acceptedAt = new Date();
        await invite.save();

        return NextResponse.json({
            success: true,
            projectId: project.projectId,
            projectTitle: project.title,
        });
    } catch {
        return NextResponse.json(
            { message: "Không thể chấp nhận lời mời" },
            { status: 500 }
        );
    }
}

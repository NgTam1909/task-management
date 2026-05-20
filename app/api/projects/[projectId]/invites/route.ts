import crypto from "crypto";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Project, { IProjectMember } from "@/models/project.model";
import {ProjectRole} from "@/types/project";
import ProjectInvite from "@/models/projectInvite.model";
import User from "@/models/user.model";
import { createInviteSchema } from "@/lib/validations/invite.validation";
import { sendProjectInviteEmail } from "@/lib/mail";
import ActivityLog, { ActivityAction } from "@/models/activityLog.model";
import {getUserIdFromRequest} from "@/lib/jwt";


function getRequestOrigin(req: NextRequest) {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    const protocol =
        req.headers.get("x-forwarded-proto") ??
        (host?.startsWith("localhost") ? "http" : "https");
    if (!host) return null;
    return `${protocol}://${host}`;
}

function canInvite(role: ProjectRole | null) {
    return role === ProjectRole.ADMIN || role === ProjectRole.LEADER;
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

        const body = await req.json();
        const parsed = createInviteSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { message: "Lỗi định dạng", errors: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const email = parsed.data.email.trim().toLowerCase();

        await connectDB();

        let project = await Project.findOne({ projectId, isActive: true });
        if (!project && mongoose.isValidObjectId(projectId)) {
            project = await Project.findById(projectId);
        }

        if (!project) {
            return NextResponse.json({ message: "Project not found" }, { status: 404 });
        }

        if (project.isPublic) {
            return NextResponse.json(
                { message: "Dự án công khai có thể tham gia qua link" },
                { status: 400 }
            );
        }

        let currentRole: ProjectRole | null = null;
        if (project.owner?.userId?.toString() === userId) {
            currentRole = project.owner.role;
        } else {
            const member = project.members.find((m: IProjectMember) => m.userId?.toString() === userId);
            currentRole = member?.role ?? null;
        }

        if (!canInvite(currentRole)) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const existingUser = await User.findOne({ email }).select("_id email");
        if (existingUser) {
            const isMember =
                project.owner?.userId?.toString() === existingUser._id.toString() ||
                project.members?.some(
                    (m: IProjectMember) => m.userId?.toString() === existingUser._id.toString()
                );
            if (isMember) {
                return NextResponse.json(
                    { message: "Người dùng đã là thành viên dự án" },
                    { status: 409 }
                );
            }
        }

        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
        const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

        const now = new Date();
        let invite = await ProjectInvite.findOne({
            projectId: project._id,
            email,
            acceptedAt: null,
            expiresAt: { $gt: now },
        });

        if (invite) {
            invite.tokenHash = tokenHash;
            invite.expiresAt = expiresAt;
            invite.invitedBy = new mongoose.Types.ObjectId(userId);
            invite.role = ProjectRole.MEMBER;
            await invite.save();
        } else {
            invite = new ProjectInvite({
                projectId: project._id,
                email,
                invitedBy: new mongoose.Types.ObjectId(userId),
                role: ProjectRole.MEMBER,
                tokenHash,
                expiresAt,
            });
            await invite.save();
        }

        const origin = getRequestOrigin(req);
        if (!origin) {
            return NextResponse.json(
                { message: "Unable to determine host" },
                { status: 500 }
            );
        }

        const inviter = await User.findById(userId).select("firstName lastName email");
        const inviterName = inviter
            ? `${inviter.lastName ?? ""} ${inviter.firstName ?? ""}`.trim()
            : undefined;

        const inviteLink = `${origin}/invite/${rawToken}`;
        await sendProjectInviteEmail(email, inviteLink, project.title, inviterName);

        // Notify invited users who already exist in the system (in-app notification).
        if (existingUser?._id) {
            try {
                await ActivityLog.create({
                    userId: new mongoose.Types.ObjectId(userId),
                    projectId: project._id,
                    entityType: "Invite",
                    action: ActivityAction.INVITE_MEMBER,
                    newValue: { email, role: ProjectRole.MEMBER },
                    metadata: {
                        projectId: project.projectId,
                        projectTitle: project.title,
                        affectedUserIds: [existingUser._id.toString()],
                        inviteEmail: email,
                    },
                });
            } catch {
                // ignore audit log errors
            }
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json(
            { message: "Failed to send invite" },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import dbConnect from "@/lib/db"
import Project, { IProjectMember } from "@/models/project.model"
import {ProjectRole} from "@/types/project";
import User from "@/models/user.model"
import { updateMemberRoleSchema } from "@/lib/validations/member.validation"
import ActivityLog, { ActivityAction } from "@/models/activityLog.model"
import {getUserIdFromRequest} from "@/lib/jwt";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const userId = await getUserIdFromRequest(req)
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const { projectId } = await params
        if (!projectId) {
            return NextResponse.json({ message: "Không thấy projectId" }, { status: 400 })
        }

        await dbConnect()

        let project = await Project.findOne({ projectId, isActive: true })
        if (!project && mongoose.isValidObjectId(projectId)) {
            project = await Project.findById(projectId)
        }

        if (!project) {
            return NextResponse.json({ message: "Không tìm thấy dự án" }, { status: 404 })
        }

        const isMember =
            project.owner?.userId?.toString() === userId ||
            project.members?.some((m: IProjectMember) => m.userId?.toString() === userId)

        if (!isMember) {
            return NextResponse.json({ message: "Người dùng không phải thành viên dự án" }, { status: 403 })
        }

        const currentRole =
            project.owner?.userId?.toString() === userId
                ? project.owner.role
                : project.members.find((m: IProjectMember) => m.userId?.toString() === userId)?.role ??
                  null

        const ownerId = project.owner.userId.toString()
        const memberIds = project.members.map((m: IProjectMember) => m.userId.toString())
        const allIds = Array.from(new Set([ownerId, ...memberIds]))

        const users = await User.find({ _id: { $in: allIds } })
            .select("firstName lastName email")
            .lean()

        const userMap = new Map(
            users.map((u) => [
                u._id.toString(),
                {
                    id: u._id.toString(),
                    name: `${u.lastName} ${u.firstName}`.trim(),
                    email: u.email,
                },
            ])
        )

        const members = [
            {
                ...userMap.get(ownerId),
                role: project.owner.role,
                isOwner: true,
            },
            ...project.members
                .filter((m: IProjectMember) => m.userId.toString() !== ownerId)
                .map((m: IProjectMember) => ({
                    ...userMap.get(m.userId.toString()),
                    role: m.role,
                    isOwner: false,
                })),
        ].filter((m) => m && m.id)

        return NextResponse.json({ members, currentRole })
    } catch {
        return NextResponse.json(
            { message: "Không thấy thành viên dự án" },
            { status: 500 }
        )
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const userId = await getUserIdFromRequest(req)
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const { projectId } = await params
        if (!projectId) {
            return NextResponse.json({ message: "Không thấy projectId" }, { status: 400 })
        }

        const body = await req.json()
        const parsed = updateMemberRoleSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { message: "Dữ liệu không hợp lệ", errors: parsed.error.flatten() },
                { status: 400 }
            )
        }

        await dbConnect()

        let project = await Project.findOne({ projectId, isActive: true })
        if (!project && mongoose.isValidObjectId(projectId)) {
            project = await Project.findById(projectId)
        }

        if (!project) {
            return NextResponse.json({ message: "Không tìm thấy dự án" }, { status: 404 })
        }

        const currentRole =
            project.owner?.userId?.toString() === userId
                ? project.owner.role
                : project.members.find((m: IProjectMember) => m.userId?.toString() === userId)?.role ??
                  null

        if (currentRole !== ProjectRole.ADMIN) {
            return NextResponse.json({ message: "Người dùng không  có quyền admin" }, { status: 403 })
        }

        const { memberId, role } = parsed.data
        const ownerId = project.owner.userId.toString()
        if (memberId === ownerId) {
            return NextResponse.json(
                { message: "Không thể đổi quyền Admin" },
                { status: 400 }
            )
        }

        const member = project.members.find((m: IProjectMember) => m.userId?.toString() === memberId)
        if (!member) {
            return NextResponse.json({ message: "Member not found" }, { status: 404 })
        }

        const oldRole = member.role
        member.role = role
        await project.save()

        if (oldRole !== role) {
            try {
                await ActivityLog.create({
                    userId: new mongoose.Types.ObjectId(userId),
                    projectId: project._id,
                    entityType: "Invite",
                    action: ActivityAction.CHANGE_ROLE,
                    oldValue: { role: oldRole },
                    newValue: { role },
                    metadata: {
                        projectId: project.projectId,
                        projectTitle: project.title,
                        affectedUserIds: [memberId],
                        targetUserId: memberId,
                    },
                })
            } catch {
                // ignore audit log errors
            }
        }

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json(
            { message: "Không thấy cập nhật quyền" },
            { status: 500 }
        )
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const userId = await getUserIdFromRequest(req)
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const { projectId } = await params
        if (!projectId) {
            return NextResponse.json({ message: "Không thuộc projectId" }, { status: 400 })
        }

        const body = await req.json()
        const memberId = typeof body?.memberId === "string" ? body.memberId : ""
        if (!memberId) {
            return NextResponse.json({ message: "Thiếu memberId" }, { status: 400 })
        }

        await dbConnect()

        let project = await Project.findOne({ projectId, isActive: true })
        if (!project && mongoose.isValidObjectId(projectId)) {
            project = await Project.findById(projectId)
        }

        if (!project) {
            return NextResponse.json({ message: "Không tìm thấy dự án" }, { status: 404 })
        }

        const currentRole =
            project.owner?.userId?.toString() === userId
                ? project.owner.role
                : project.members.find((m: IProjectMember) => m.userId?.toString() === userId)?.role ??
                  null

        if (currentRole !== ProjectRole.ADMIN) {
            return NextResponse.json({ message: "Người dùng không có quyền admin" }, { status: 403 })
        }

        const ownerId = project.owner.userId.toString()
        if (memberId === ownerId) {
            return NextResponse.json(
                { message: "Không thể xóa admin khỏi dự án" },
                { status: 400 }
            )
        }

        const memberIndex = project.members.findIndex(
            (m: IProjectMember) => m.userId?.toString() === memberId
        )
        if (memberIndex === -1) {
            return NextResponse.json({ message: "Member not found" }, { status: 404 })
        }

        const removedMember = project.members[memberIndex]
        project.members.splice(memberIndex, 1)
        await project.save()

        try {
            await ActivityLog.create({
                userId: new mongoose.Types.ObjectId(userId),
                projectId: project._id,
                entityType: "Invite",
                action: ActivityAction.REMOVE_MEMBER,
                oldValue: { role: removedMember.role },
                metadata: {
                    projectId: project.projectId,
                    projectTitle: project.title,
                    affectedUserIds: [memberId],
                    targetUserId: memberId,
                },
            })
        } catch {
            // ignore audit log errors
        }

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json(
            { message: "Không thể xóa thành viên" },
            { status: 500 }
        )
    }
}

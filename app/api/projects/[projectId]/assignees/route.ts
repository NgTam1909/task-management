import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import dbConnect from "@/lib/db"
import Project, { IProjectMember } from "@/models/project.model"
import {ProjectRole} from "@/types/project";
import User from "@/models/user.model"
import {LeanUser} from "@/types/task"
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

        let currentRole: ProjectRole | null
        if (project.owner?.userId?.toString() === userId) {
            currentRole = project.owner.role
        } else {
            const member = project.members.find((m: IProjectMember) => m.userId?.toString() === userId)
            currentRole = member?.role ?? null
        }

        if (!currentRole) {
            return NextResponse.json({ message: "Quyền người dùng không hợp lệ" }, { status: 403 })
        }

        const ownerId = project.owner.userId.toString()
        const memberIds = project.members.map((m: IProjectMember) => m.userId.toString())
        const allIds = Array.from(new Set([ownerId, ...memberIds]))

        let assignableIds: string[]
        if (currentRole === ProjectRole.MEMBER) {
            assignableIds = [userId]
        } else if (currentRole === ProjectRole.LEADER) {
            const memberOnlyIds = project.members
                .filter((m: IProjectMember) => m.role === ProjectRole.MEMBER)
                .map((m: IProjectMember) => m.userId.toString())
            assignableIds = Array.from(new Set([userId, ...memberOnlyIds]))
        } else {
            assignableIds = allIds
        }

        const users = (await User.find({ _id: { $in: assignableIds } })
            .select("firstName lastName email position skills")
            .lean()) as LeanUser[]

        const userMap = new Map(
            users.map((u) => [
                u._id.toString(),
                {
                    id: u._id.toString(),
                    name: `${u.lastName} ${u.firstName}`.trim(),
                    email: u.email,
                    address: u.address ?? null,
                },
            ])
        )

        const assignees = assignableIds
            .map((id) => userMap.get(id))
            .filter((item): item is NonNullable<typeof item> => Boolean(item))

        return NextResponse.json({
            currentUserId: userId,
            currentUserRole: currentRole,
            assignees,
        })
    } catch {
        return NextResponse.json(
            { message: " Không thể lấy danh sách thành viên" },
            { status: 500 }
        )
    }
}

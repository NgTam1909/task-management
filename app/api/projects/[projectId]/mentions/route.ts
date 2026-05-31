import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"

import dbConnect from "@/lib/db"
import { getUserIdFromRequest } from "@/lib/jwt"

import Project, { IProjectMember } from "@/models/project.model"
import User from "@/models/user.model"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const userId = await getUserIdFromRequest(req)

        if (!userId) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        }

        const { projectId } = await params

        if (!projectId) {
            return NextResponse.json(
                { message: "Thiếu projectId" },
                { status: 400 }
            )
        }

        await dbConnect()

        let project = await Project.findOne({
            projectId,
            isActive: true,
        })

        if (!project && mongoose.isValidObjectId(projectId)) {
            project = await Project.findById(projectId)
        }

        if (!project) {
            return NextResponse.json(
                { message: "Không tìm thấy dự án" },
                { status: 404 }
            )
        }

        const isMember =
            project.owner?.userId?.toString() === userId ||
            project.members.some(
                (m: IProjectMember) =>
                    m.userId?.toString() === userId
            )

        if (!isMember) {
            return NextResponse.json(
                { message: "Forbidden" },
                { status: 403 }
            )
        }

        const ownerId = project.owner.userId.toString()

        const memberIds = project.members.map(
            (m: IProjectMember) => m.userId.toString()
        )

        const allIds = Array.from(
            new Set([ownerId, ...memberIds])
        ).filter((id) => id !== userId) // không cho tag chính mình

        const users = await User.find({
            _id: { $in: allIds },
        })
            .select("firstName lastName email")
            .lean()

        const mentions = users.map((user: any) => ({
            id: user._id.toString(),
            name: `${user.lastName ?? ""} ${user.firstName ?? ""}`.trim(),
            email: user.email ?? null,
        }))

        return NextResponse.json({
            mentions,
        })
    } catch (error) {
        console.error(error)

        return NextResponse.json(
            { message: "Không thể lấy danh sách mention" },
            { status: 500 }
        )
    }
}
import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Project from "@/models/project.model"
import {ProjectRole} from "@/types/project";
import { createProjectSchema } from "@/lib/validations/project.validation"
import ActivityLog, { ActivityAction } from "@/models/activityLog.model"
import {getUserIdFromRequest} from "@/lib/jwt";
import {generateProjectId} from "@/lib/generateId";
export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req)
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        await dbConnect()

        const projects = await Project.find({
            isActive: true,
            $or: [{ "owner.userId": userId }, { "members.userId": userId }],
        })
            .select("title projectId isPublic createdAt startDate endDate owner members")
            .sort({ createdAt: -1 })

        for (const project of projects) {
            if (!project.projectId) {
                project.projectId = await generateProjectId()
                await project.save()
            }
        }

        const rolePriority = {
            [ProjectRole.ADMIN]: 3,
            [ProjectRole.LEADER]: 2,
            [ProjectRole.MEMBER]: 1,
        }

        const result = projects.map((project: any) => {
            const isOwner =
                project.owner?.userId?.toString() === userId

            let currentUserRole: ProjectRole =
                ProjectRole.MEMBER

            if (isOwner) {
                currentUserRole = project.owner.role
            } else {
                const member = project.members?.find(
                    (m: any) =>
                        m.userId?.toString() === userId
                )

                if (member) {
                    currentUserRole = member.role
                }
            }

            return {
                _id: project._id,
                title: project.title,
                projectId: project.projectId,
                description: project.description ?? "",
                isPublic: project.isPublic,
                startDate: project.startDate,
                endDate: project.endDate,
                createdAt: project.createdAt,

                isOwner,
                currentUserRole,
            }
        })

        result.sort(
            (a, b) =>
                rolePriority[b.currentUserRole] -
                rolePriority[a.currentUserRole]
        )

        return NextResponse.json(result)
    } catch {
        return NextResponse.json(
            { message: "Không thể lấy danh sách dự án" },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req)
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const parsed = createProjectSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { message: "Dữ liệu không hợp lệ", errors: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const { title, description,startDate, endDate, visibility } = parsed.data

        await dbConnect()

        const projectId = await generateProjectId()

        const project = new Project({
            title,
            projectId,
            description,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            isPublic: visibility === "public",
            isActive: true,
            owner: {
                userId: new mongoose.Types.ObjectId(userId),
                role: ProjectRole.ADMIN,
                joinedAt: new Date(),
            },
            members: [
                {
                    userId: new mongoose.Types.ObjectId(userId),
                    role: ProjectRole.ADMIN,
                    joinedAt: new Date(),
                },
            ],
        })
        await project.save()

        try {
            await ActivityLog.create({
                userId: new mongoose.Types.ObjectId(userId),
                projectId: project._id,
                entityType: "Project",
                entityId: project._id,
                action: ActivityAction.CREATE_PROJECT,
                newValue: {
                    title: project.title,
                    description: project.description ?? "",
                    startDate: project.startDate,
                    endDate: project.endDate,
                    isPublic: project.isPublic,
                },
            })
        } catch {
            // ignore audit log errors
        }

        return NextResponse.json(
            {
                _id: project._id,
                title: project.title,
                description: project.description,
                projectId: project.projectId,
                startDate: project.startDate ? project.startDate.toISOString().split('T')[0] : "",
                endDate: project.endDate ? project.endDate.toISOString().split('T')[0] : "",
                isPublic: project.isPublic,
            },
            { status: 201 }
        )
    } catch {
        return NextResponse.json(
            { message: "Không thể tạo dự án" },
            { status: 500 }
        )
    }
}

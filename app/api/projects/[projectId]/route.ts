import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"
import Project, { IProjectMember } from "@/models/project.model"
import {ProjectRole} from "@/types/project";
import { updateProjectSchema } from "@/lib/validations/project.validation"
import ActivityLog, { ActivityAction } from "@/models/activityLog.model"
import {getUserIdFromRequest} from "@/lib/jwt";
import dbConnect from "@/lib/db";

function slugify(input: string) {
    const normalized = input
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

    return normalized || "project"
}

async function generateProjectId(title: string) {
    const base = slugify(title)
    let projectId = base
    let counter = 1

    while (await Project.exists({ projectId })) {
        projectId = `${base}-${counter}`
        counter += 1
    }

    return projectId
}
async function findProjectByParam(projectId: string) {
    let project = await Project.findOne({ projectId, isActive: true })
    if (!project && mongoose.isValidObjectId(projectId)) {
        project = await Project.findById(projectId)
    }
    return project
}

function getUserRole(project: typeof Project.prototype, userId: string) {
    if (project.owner?.userId?.toString() === userId) {
        return project.owner.role
    }
    const member = project.members.find((m: IProjectMember) => m.userId?.toString() === userId)
    return member?.role ?? null
}

function canEditProject(role: ProjectRole | null) {
    return role === ProjectRole.ADMIN || role === ProjectRole.LEADER
}

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

        const project = await findProjectByParam(projectId)
        if (!project) {
            return NextResponse.json({ message: "Không tìm thấy dự án" }, { status: 404 })
        }

        const isMember =
            project.owner?.userId?.toString() === userId ||
            project.members?.some((m: IProjectMember) => m.userId?.toString() === userId)

        if (!isMember) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        return NextResponse.json({
            projectId: project.projectId,
            title: project.title,
            description: project.description ?? "",
            isPublic: project.isPublic,
        })
    } catch {
        return NextResponse.json(
            { message: "Không thể lấy thông tin dự án" },
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
        const parsed = updateProjectSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { message: "Dữ liệu không hợp lệ", errors: parsed.error.flatten() },
                { status: 400 }
            )
        }

        await dbConnect()

        const project = await findProjectByParam(projectId)
        if (!project) {
            return NextResponse.json({ message: "Không tìm thấy dự án" }, { status: 404 })
        }

        const role = getUserRole(project, userId)
        if (!canEditProject(role)) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        const oldValue = {
            title: project.title,
            projectId: project.projectId ?? "",
            description: project.description ?? "",
            isPublic: project.isPublic,
        }
        let finalProjectId = project.projectId
        if (parsed.data.projectId && parsed.data.projectId !== project.projectId) {
            finalProjectId = await generateProjectId(parsed.data.projectId)
        }
        project.title = parsed.data.title
        project.projectId = finalProjectId
        project.description = parsed.data.description ?? ""
        project.isPublic = parsed.data.visibility === "public"
        await project.save()

        try {
            await ActivityLog.create({
                userId: new mongoose.Types.ObjectId(userId),
                projectId: project._id,
                entityType: "Project",
                entityId: project._id,
                action: ActivityAction.UPDATE_PROJECT,
                oldValue,
                newValue: {
                    title: project.title,
                    description: project.description ?? "",
                    isPublic: project.isPublic,
                },
            })
        } catch {
            // ignore audit log errors
        }

        return NextResponse.json({
            success: true,
            projectId: project.projectId,
            title: project.title,
            description: project.description ?? "",
            isPublic: project.isPublic,
        })
    } catch {
        return NextResponse.json(
            { message: "Không thấy cập nhật dự án" },
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

        // Kiểm tra nếu project đã bị xóa mềm
        if (!project.isActive) {
            return NextResponse.json(
                { message: "Dự án đã bị xóa trước đó" },
                { status: 400 }
            );
        }

        if (!project.owner?.userId?.equals(userId)) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        const affectedUserIds = Array.from(
            new Set(
                [
                    project.owner?.userId?.toString(),
                    ...(project.members ?? []).map((member: IProjectMember) =>
                        member.userId?.toString()
                    ),
                ].filter((value): value is string => !!value)
            )
        )

        // Soft delete: Chỉ cập nhật isActive = false
        await Project.updateOne(
            { _id: project._id },
            { $set: { isActive: false } }
        )

        // Log hoạt động xóa (đã có sẵn trong code của bạn)
        try {
            await ActivityLog.create({
                userId: new mongoose.Types.ObjectId(userId),
                projectId: project._id,
                entityType: "Project",
                entityId: project._id,
                action: ActivityAction.DELETE_PROJECT,
                oldValue: {
                    title: project.title,
                    description: project.description ?? "",
                    isPublic: project.isPublic,
                },
                metadata: {
                    projectId: project.projectId,
                    projectTitle: project.title,
                    affectedUserIds,
                },
            })
        } catch {
            // ignore audit log errors
        }

        return NextResponse.json({ success: true, message: "Đã xóa dự án" })
    } catch {
        return NextResponse.json(
            { message: "Không thể xóa dự án" },
            { status: 500 }
        )
    }
}
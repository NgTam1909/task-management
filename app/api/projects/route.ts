import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Project from "@/models/project.model"
import {ProjectRole} from "@/types/project";
import { createProjectSchema } from "@/lib/validations/project.validation"
import ActivityLog, { ActivityAction } from "@/models/activityLog.model"
import {getUserIdFromRequest} from "@/lib/jwt";

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
            .select("title projectId isPublic createdAt")
            .sort({ createdAt: -1 })

        for (const project of projects) {
            if (!project.projectId) {
                project.projectId = await generateProjectId(project.title)
                await project.save()
            }
        }

        return NextResponse.json(projects)
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

        const { title, description, visibility } = parsed.data

        await dbConnect()

        const projectId = await generateProjectId(title)

        const project = new Project({
            title,
            projectId,
            description,
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
                projectId: project.projectId,
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

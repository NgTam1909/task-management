
import {NextRequest, NextResponse} from "next/server";
import connectDB from "@/lib/db";
import Project from "@/models/project.model";
import dbConnect from "@/lib/db";
import {getUserIdFromRequest} from "@/lib/jwt";
import mongoose from "mongoose";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getUserIdFromRequest(req)
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }
        const { id: projectId } = await params
        if (!projectId) {
            return NextResponse.json({ message: "Không thấy projectId" }, { status: 400 })
        }

        await dbConnect()
        async function findProjectByParam(projectId: string) {
            let project = await Project.findOne({ projectId, isActive: true })
            if (!project && mongoose.isValidObjectId(projectId)) {
                project = await Project.findById(projectId)
            }
            return project
        }
        const project = await findProjectByParam(projectId)
        if (!project) {
            return NextResponse.json({ message: "Không tìm thấy dự án" }, { status: 404 })
        }
        return NextResponse.json({
            projectId: project.projectId,
            title: project.title,
            description: project.description ?? "",
            startDate: project.startDate ?? undefined,
            endDate: project.endDate ?? undefined,
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
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await connectDB();

    const { id } = await params;

    const project =
        await Project.findByIdAndUpdate(
            id,
            {
                isActive: false,
            },
            {
                new: true,
            }
        );

    return NextResponse.json({
        success: true,
        data: project,
    });
}
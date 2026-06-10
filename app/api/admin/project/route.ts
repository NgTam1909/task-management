    import { NextRequest, NextResponse } from "next/server";
    import connectDB from "@/lib/db";
    import Project from "@/models/project.model";
    import Task from "@/models/task.model";

    export async function GET(req: NextRequest) {
        await connectDB();

        const { searchParams } = new URL(req.url);

        const page = Number(searchParams.get("page") || 1);
        const limit = Number(searchParams.get("limit") || 7);
        const search = searchParams.get("search") || "";

        const query = search
            ? {
                title: {
                    $regex: search,
                    $options: "i",
                },
            }
            : {};

        const projects = await Project.find(query)
            .populate(
                "owner.userId",
                "firstName lastName email"
            )
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const total = await Project.countDocuments(query);

        const projectData = await Promise.all(
            projects.map(async (project: any) => {
                const taskCount =
                    await Task.countDocuments({
                        projectId: project._id,
                    });

                return {
                    _id: project._id,
                    projectId: project.projectId,
                    title: project.title,
                    owner:
                        project.owner?.userId
                            ? `${project.owner.userId.lastName} ${project.owner.userId.firstName}`
                            : "Không xác định",
                    startDate: project.startDate,
                    endDate: project.endDate,
                    taskCount,
                    memberCount:
                        project.members?.length ?? 0,
                    isPublic: project.isPublic,
                    accessType: project.isPublic
                        ? "PUBLIC"
                        : "PRIVATE",

                    status: project.isActive
                        ? "ACTIVE"
                        : "SOFT DELETED",

                    createdAt:
                    project.createdAt,
                };
            })
        );

        return NextResponse.json({
            success: true,
            data: projectData,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
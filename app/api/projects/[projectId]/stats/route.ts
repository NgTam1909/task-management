import { NextRequest, NextResponse } from "next/server"
import TaskModel from "@/models/task.model"
import mongoose from "mongoose"
import dbConnect from "@/lib/db"
import Project from "@/models/project.model"
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
            return NextResponse.json(
                { error: "Missing projectId" },
                { status: 400 }
            )
        }

        await dbConnect()

        let project = await Project.findOne({ projectId, isActive: true })
        if (!project && mongoose.isValidObjectId(projectId)) {
            project = await Project.findById(projectId)
        }

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 })
        }

        const isMember =
            project.owner?.userId?.toString() === userId ||
            project.members?.some((m) => m.userId?.toString() === userId)

        if (!isMember) {
            return NextResponse.json({ message: "Người dùng không phải thành viên dự án" }, { status: 403 })
        }
        const projectObjectId = new mongoose.Types.ObjectId(project._id)

        const stats = await TaskModel.aggregate([
            {
                $match: { projectId: projectObjectId }
            },
            {
                $facet: {
                    byStatus: [
                        {
                            $group: {
                                _id: "$status",
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    byUser: [
                        {
                            $project: {
                                assignees: { $ifNull: ["$assignees", []] }
                            }
                        },
                        {
                            $unwind: {
                                path: "$assignees",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: "users",
                                localField: "assignees",
                                foreignField: "_id",
                                as: "assignee"
                            }
                        },
                        {
                            $unwind: {
                                path: "$assignee",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $addFields: {
                                assigneeName: {
                                    $trim: {
                                        input: {
                                            $concat: [
                                                { $ifNull: ["$assignee.firstName", ""] },
                                                " ",
                                                { $ifNull: ["$assignee.lastName", ""] }
                                            ]
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    $cond: [
                                        { $eq: ["$assigneeName", ""] },
                                        "Unassigned",
                                        "$assigneeName"
                                    ]
                                },
                                count: { $sum: 1 }
                            }
                        },
                        {
                            $sort: { count: -1 }
                        }
                    ],
                    total: [
                        {
                            $count: "count"
                        }
                    ]
                }
            }
        ])

        const payload = stats[0] ?? { byStatus: [], byUser: [], total: [] }
        return NextResponse.json(payload)
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch stats" },
            { status: 500 }
        )
    }
}

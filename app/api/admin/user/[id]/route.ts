// app/api/admin/users/[id]/route.ts

import { NextResponse } from "next/server";
import User from "@/models/user.model";
import Project from "@/models/project.model";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const user = await User.findById(id).lean();

    const projectCount =
        await Project.countDocuments({
            "members.userId": id,
        });

    return NextResponse.json({
        user,
        projectCount,
    });
}
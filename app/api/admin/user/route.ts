// app/api/admin/users/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";

export async function GET(req: NextRequest) {
    await connectDB();

    const search = req.nextUrl.searchParams.get("search") ?? "";
    const page = Number(req.nextUrl.searchParams.get("page") ?? 1);
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? 10);

    const filter = search
        ? {
            $or: [
                {
                    firstName: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    lastName: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    email: {
                        $regex: search,
                        $options: "i",
                    },
                },
            ],
        }
        : {};

    const [users, total] = await Promise.all([
        User.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),

        User.countDocuments(filter),
    ]);

    return NextResponse.json({
        success: true,
        data: users,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
}
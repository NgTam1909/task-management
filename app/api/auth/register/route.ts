import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/models/user.model"
import { registerSchema } from "@/lib/validations/auth.validation"

export async function POST(req: Request) {
    try {
        await dbConnect()
        const body = await req.json()

        // Validate bằng Zod
        const parsed = registerSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                {
                    message: "Lỗi xác thực",
                    errors: parsed.error.flatten().fieldErrors,
                },
                { status: 400 }
            )
        }

        const { firstName, lastName, email, phone, password } = parsed.data

        // Check email tồn tại
        const existing = await User.findOne({ email })

        if (existing) {
            return NextResponse.json(
                { message: "Email đã tồn tại" },
                { status: 400 }
            )
        }
        // Check số điện thoại tồn tại
        const existingByPhone = await User.findOne({ phone })

        if (existingByPhone) {
            return NextResponse.json(
                { message: "Số điện thoại đã tồn tại" },
                { status: 400 }
            )
        }
        await User.create({
            firstName,
            lastName,
            email,
            phone,
            password,
        })

        return NextResponse.json(
            { message: "Người dùng đã được tạo thành công" },
            { status: 201 }
        )

    } catch (error) {
        return NextResponse.json(
            { message: "Lỗi server" },
            { status: 500 }
        )
    }
}
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import dbConnect from "@/lib/db"
import User from "@/models/user.model"

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const token = (body?.token as string | undefined)?.trim()
        const password = body?.password as string | undefined
        const confirmPassword = body?.confirmPassword as string | undefined

        if (!token) {
            return NextResponse.json(
                { message: "Token không hợp lệ" },
                { status: 400 }
            )
        }

        if (!password || password.length < 6) {
            return NextResponse.json(
                { message: "Mật khẩu phải có ít nhất 6 ký tự" },
                { status: 400 }
            )
        }

        if (password !== confirmPassword) {
            return NextResponse.json(
                { message: "Mật khẩu xác nhận không khớp" },
                { status: 400 }
            )
        }

        await dbConnect()

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: new Date() },
        }).select("+resetPasswordToken +resetPasswordExpires")

        if (!user) {
            return NextResponse.json(
                { message: "Token hết hạn hoặc không hợp lệ" },
                { status: 400 }
            )
        }

        user.password = password
        user.resetPasswordToken = undefined
        user.resetPasswordExpires = undefined
        await user.save()

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json(
            { message: "Không thể đặt lại mật khẩu" },
            { status: 500 }
        )
    }
}

import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import dbConnect from "@/lib/db"
import User from "@/models/user.model"
import { sendResetEmail } from "@/lib/mail"

function getRequestOrigin(req: NextRequest) {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host")
    const protocol =
        req.headers.get("x-forwarded-proto") ??
        (host?.startsWith("localhost") ? "http" : "https")
    if (!host) return null
    return `${protocol}://${host}`
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const email = (body?.email as string | undefined)?.trim().toLowerCase()

        if (!email) {
            return NextResponse.json(
                { message: "Email không hợp lệ" },
                { status: 400 }
            )
        }

        await dbConnect()

        const user = await User.findOne({ email }).select("+resetPasswordToken +resetPasswordExpires")
        if (!user) {
            return NextResponse.json(
                { message: "Email không tồn tại trong hệ thống." },
                { status: 404 }
            )
        }

        const rawToken = crypto.randomBytes(32).toString("hex")
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex")
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

        user.resetPasswordToken = hashedToken
        user.resetPasswordExpires = expiresAt
        await user.save()

        const origin = getRequestOrigin(req)
        if (!origin) {
            return NextResponse.json(
                { message: "Không xác định được host" },
                { status: 500 }
            )
        }

        const resetLink = `${origin}/reset-password?token=${rawToken}`
        await sendResetEmail(email, resetLink)

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json(
            { message: "Không thể gửi email đặt lại mật khẩu" },
            { status: 500 }
        )
    }
}

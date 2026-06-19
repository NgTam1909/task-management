import {signToken} from "@/lib/jwt";
import {NextResponse} from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/user.model";

export async function POST(req: Request) {
    await dbConnect()
    const { email, password } = await req.json()

    const user = await User.findOne({ email }).select("+password")

    if (!user) {
        return NextResponse.json({ message: "Thông tin không chính xác" }, { status: 401 })
    }

    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
        return NextResponse.json({ message: "Mật khẩu không chính xác" }, { status: 401 })
    }

    user.lastLoginAt = new Date()
    await user.save()

    const token = signToken({
        id: user._id.toString(),
        email: user.email,
        isGod: user.isGod,
        firstName: user.firstName,
        lastName: user.lastName
    })

    const response = NextResponse.json({ success: true })

    const isProd = process.env.NODE_ENV === "production"
    response.cookies.set("accessToken", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
    })

    return response
}

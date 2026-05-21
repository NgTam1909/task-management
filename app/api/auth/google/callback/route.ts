import { NextRequest, NextResponse } from "next/server"
import dbConnect  from "@/lib/db"
import { signToken } from "@/lib/jwt"
import User from "@/models/user.model"

const TOKEN_URL = "https://oauth2.googleapis.com/token"
const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
const DEFAULT_REDIRECT = "/dashboard"

function decodeState(state: string) {
  try {
    return JSON.parse(Buffer.from(state, "base64").toString("utf8")) as { redirect?: string; nonce?: string }
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state")
    const savedState = req.cookies.get("google_oauth_state")?.value

    // 1. Kiểm tra CSRF State bảo mật
    if (!code || !state || !savedState || state !== savedState) {
      const redirectUrl = new URL("/login", req.url)
      redirectUrl.searchParams.set("error", "google_auth_failed")
      return NextResponse.redirect(redirectUrl)
    }

    const parsedState = decodeState(state)
    const redirect = parsedState?.redirect?.startsWith("/") ? parsedState.redirect : DEFAULT_REDIRECT
    const callbackUrl = new URL("/api/auth/google/callback", req.url).toString()

    // 2. Đổi Authorization Code lấy Access Token
    const body = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
    })

    const tokenResponse = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    })

    if (!tokenResponse.ok) {
      const redirectUrl = new URL("/login", req.url)
      redirectUrl.searchParams.set("error", "google_auth_failed")
      return NextResponse.redirect(redirectUrl)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      const redirectUrl = new URL("/login", req.url)
      redirectUrl.searchParams.set("error", "google_auth_failed")
      return NextResponse.redirect(redirectUrl)
    }

    // 3. Lấy thông tin User từ Google
    const userInfoResponse = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!userInfoResponse.ok) {
      const redirectUrl = new URL("/login", req.url)
      redirectUrl.searchParams.set("error", "google_auth_failed")
      return NextResponse.redirect(redirectUrl)
    }

    const userInfo = await userInfoResponse.json()
    const googleId = userInfo.sub
    const email = userInfo.email?.toLowerCase()
    const firstName = userInfo.given_name || ""
    const lastName = userInfo.family_name || ""
    const emailVerified = userInfo.email_verified; // Thêm trường kiểm tra bảo mật email

    if (!googleId || !email) {
      const redirectUrl = new URL("/login", req.url)
      redirectUrl.searchParams.set("error", "google_auth_failed")
      return NextResponse.redirect(redirectUrl)
    }

    await dbConnect()

    // 4. Xử lý logic Account Linking (Liên kết tài khoản)
    let user = await User.findOne({ googleId })

    if (!user && emailVerified) { // Chỉ tự động liên kết nếu email từ Google đã được verified
      user = await User.findOne({ email })
    } else if (!user && !emailVerified) {
      // Nếu email chưa verified ở phía Google, chặn lại không cho liên kết tự động để tránh chiếm quyền
      const redirectUrl = new URL("/login", req.url)
      redirectUrl.searchParams.set("error", "email_not_verified")
      return NextResponse.redirect(redirectUrl)
    }

    if (user) {
      // Cập nhật thông tin Google ID cho tài khoản cũ (Đúng logic bạn cần)
      if (!user.googleId) user.googleId = googleId
      if (!user.firstName && firstName) user.firstName = firstName
      if (!user.lastName && lastName) user.lastName = lastName
      await user.save()
    } else {
      // Tạo tài khoản mới hoàn toàn nếu chưa từng tồn tại cả GoogleID lẫn Email
      user = await User.create({
        email,
        googleId,
        firstName: firstName || "Google User",
        lastName: lastName || "",
      })
    }

    // 5. Ký mã Token JWT nội bộ của hệ thống ứng dụng
    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      isGod: user.isGod,
      firstName: user.firstName,
      lastName: user.lastName
    })

    // Sử dụng an toàn URL gốc từ request thay vì dựa hoàn toàn vào NEXTAUTH_URL env
    const response = NextResponse.redirect(new URL(redirect, req.url))

    response.cookies.set("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    })

    // Xóa cookie state sau khi dùng xong
    response.cookies.set("google_oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })

    return response

  } catch (error) {
    // Catch toàn bộ các lỗi liên quan đến sập mạng, DB timeout để redirect an toàn về trang login kèm mã lỗi
    const redirectUrl = new URL("/login", req.url)
    redirectUrl.searchParams.set("error", "server_error")
    return NextResponse.redirect(redirectUrl)
  }
}
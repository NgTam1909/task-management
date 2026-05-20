import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { signToken } from "@/lib/jwt"
import User from "@/models/user.model"

const TOKEN_URL = "https://oauth2.googleapis.com/token"
const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
const DEFAULT_REDIRECT = "/dashboard"

function encodeState(state: Record<string, string>) {
  return Buffer.from(JSON.stringify(state)).toString("base64")
}

function decodeState(state: string) {
  try {
    return JSON.parse(Buffer.from(state, "base64").toString("utf8")) as { redirect?: string; nonce?: string }
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const savedState = req.cookies.get("google_oauth_state")?.value

  if (!code || !state || !savedState || state !== savedState) {
    const redirectUrl = new URL("/login", req.url)
    redirectUrl.searchParams.set("error", "google_auth_failed")
    return NextResponse.redirect(redirectUrl)
  }

  const parsedState = decodeState(state)
  const redirect = parsedState?.redirect?.startsWith("/") ? parsedState.redirect : DEFAULT_REDIRECT

  const callbackUrl = new URL("/api/auth/google/callback", req.url).toString()

  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirect_uri: callbackUrl,
    grant_type: "authorization_code",
  })

  const tokenResponse = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
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

  const userInfoResponse = await fetch(USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
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

  if (!googleId || !email) {
    const redirectUrl = new URL("/login", req.url)
    redirectUrl.searchParams.set("error", "google_auth_failed")
    return NextResponse.redirect(redirectUrl)
  }

  await connectDB()

  let user = await User.findOne({ googleId })

  if (!user) {
    user = await User.findOne({ email })
  }

  if (user) {
    if (!user.googleId) {
      user.googleId = googleId
    }
    if (!user.firstName && firstName) user.firstName = firstName
    if (!user.lastName && lastName) user.lastName = lastName
    await user.save()
  } else {
    user = await User.create({
      email,
      googleId,
      firstName: firstName || "Google User",
      lastName: lastName || "",
    })
  }

  const token = signToken({
    id: user._id.toString(),
    email: user.email,
    isGod: user.isGod,
  })

  const response = NextResponse.redirect(redirect)
  response.cookies.set("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  })
  response.cookies.set("google_oauth_state", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })

  return response
}

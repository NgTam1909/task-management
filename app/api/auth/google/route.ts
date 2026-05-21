import { NextResponse } from "next/server"

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const DEFAULT_REDIRECT = "/dashboard"

function encodeState(state: Record<string, string>) {
  return Buffer.from(JSON.stringify(state)).toString("base64")
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const redirect = url.searchParams.get("redirect") || DEFAULT_REDIRECT
  const cleanRedirect = redirect.startsWith("/") ? redirect : DEFAULT_REDIRECT

  const statePayload = {
    redirect: cleanRedirect,
    nonce: crypto.randomUUID(),
  }

  const state = encodeState(statePayload)

  const callbackUrl = new URL("/api/auth/google/callback", req.url)

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: callbackUrl.toString(),
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    include_granted_scopes: "true",
    state,
    prompt: "select_account",
  })

  const response = NextResponse.redirect(
      `${GOOGLE_AUTH_URL}?${params.toString()}`
  )

  response.cookies.delete("accessToken")
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  })

  return response
}

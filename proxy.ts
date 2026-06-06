import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, SECRET)
        return payload
    } catch {
        return null
    }
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl
    const token = request.cookies.get("accessToken")?.value

    const isLegacyControl =
        pathname === "/control" || pathname.startsWith("/control/")
    const isAuthPage = pathname === "/login" || pathname === "/register"
    const isProtectedRoute =
        pathname === "/dashboard" || pathname.startsWith("/dashboard/")

    if (isLegacyControl) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    if (!token) {
        if (isProtectedRoute) {
            const loginUrl = new URL("/login", request.url)
            loginUrl.searchParams.set("redirect", pathname)
            return NextResponse.redirect(loginUrl)
        }
        return NextResponse.next()
    }

    // Verify token
    const payload = await verifyToken(token)
    if (!payload) {
        const response = NextResponse.redirect(new URL("/login", request.url))
        response.cookies.delete("accessToken")
        return response
    }

    // Already logged in but visiting login/register
    if (isAuthPage) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // RBAC
    const isAdminRoute =
        pathname === "/admin" ||
        pathname.startsWith("/admin/")

    if (isAdminRoute) {
        if (payload?.isGod !== true) {
            return NextResponse.redirect(
                new URL("/dashboard", request.url)
            )
        }
    }

    // Inject user into request
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-user-id", payload.id as string)
    requestHeaders.set("x-user-isGod", String(payload.isGod))

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    })
}

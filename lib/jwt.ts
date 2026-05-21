import jwt from "jsonwebtoken";
import {JwtPayload} from "@/types/jwt";
import { jwtVerify } from "jose"
import {NextRequest} from "next/server";
import { cookies } from "next/headers"
import {  JWTPayload } from "jose"

export interface UserPayload extends JWTPayload {
    id?: string
    firstName?: string
    lastName?: string
    email?: string
}

export async function getCurrentUser(): Promise<UserPayload | null> {
    const cookieStore = await cookies()

    const token = cookieStore.get("accessToken")?.value

    if (!token) {
        return null
    }

    try {
        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET
        )

        const { payload } = await jwtVerify(token, secret)

        return payload as UserPayload
    } catch (error) {
        console.error("JWT verify failed:", error)

        return null
    }
}
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
export async function getUserIdFromRequest(req: NextRequest) {
    const token = req.cookies.get("accessToken")?.value
    if (!token) return null

    try {
        const { payload } = await jwtVerify(token, SECRET)
        const id = (payload.id || payload.userId) as string | undefined
        return id ?? null
    } catch {
        return null
    }
}

const JWT_SECRET = process.env.JWT_SECRET!;

export function signToken(payload: JwtPayload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: "1d",
    });
}


import jwt from "jsonwebtoken";
import {JwtPayload} from "@/types/jwt";
import { jwtVerify } from "jose"
import {NextRequest} from "next/server";

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


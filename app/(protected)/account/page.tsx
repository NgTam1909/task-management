'use client'

import { useEffect, useState } from "react"
import UserProfile from "@/components/account/my-account"
import { GET_METHOD, PATCH_METHOD } from "@/lib/req"
import {IUser} from "@/types/user";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null
}

function parseStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return []
    return value.filter((item) => typeof item === "string")
}

function parseUser(value: unknown): IUser | null {
    if (!isRecord(value)) return null

    const _id = typeof value._id === "string" ? value._id : null
    const firstName = typeof value.firstName === "string" ? value.firstName : null
    const lastName = typeof value.lastName === "string" ? value.lastName : null
    const phone = typeof value.phone === "string" ? value.phone : null
    const email = typeof value.email === "string" ? value.email : null
    const isGod = typeof value.isGod === "boolean" ? value.isGod : false

    if (!_id || !firstName || !lastName || !phone || !email) return null

    return {
        _id,
        firstName,
        lastName,
        phone,
        email,
        address: typeof value.address === "string" ? value.address : undefined,
        isGod,
        createdAt: typeof value.createdAt === "string" ? value.createdAt : undefined,
        updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : undefined,
    }
}

export default function AccountPage() {
    const [user, setUser] = useState<IUser | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let active = true

        const load = async () => {
            try {
                setLoading(true)
                setError(null)
                const res = (await GET_METHOD("/api/auth/me")) as unknown
                if (!active) return

                if (!isRecord(res)) {
                    setError("Không thể tải thông tin tài khoản")
                    return
                }

                const nextUser = parseUser(res)
                if (!nextUser) {
                    setError("Không thể tải thông tin tài khoản")
                    return
                }
                setUser(nextUser)
            } catch {
                if (active) setError("Không thể tải thông tin tài khoản")
            } finally {
                if (active) setLoading(false)
            }
        }

        void load()

        return () => {
            active = false
        }
    }, [])

    const handleSave = async (data: Partial<IUser>) => {
        const payload = {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            address: data.address,
        }

        const res = (await PATCH_METHOD("/api/auth/me", payload)) as unknown
        if (isRecord(res) && res.success === true && isRecord(res.user)) {
            const nextUser = parseUser(res.user)
            if (nextUser) setUser(nextUser)
            return
        }

        if (isRecord(res) && typeof res.message === "string") {
            throw new Error(res.message)
        }
        throw new Error("Cập nhật thất bại")
    }

    if (loading) {
        return <div className="p-6 text-sm text-muted-foreground">Đang tải...</div>
    }

    if (error) {
        return <div className="p-6 text-sm text-red-500">{error}</div>
    }

    if (!user) return null

    return <UserProfile user={user} isEditable onSave={handleSave} />
}

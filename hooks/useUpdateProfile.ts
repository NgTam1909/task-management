'use client'

import { useEffect, useState } from "react"
import { GET_METHOD, PATCH_METHOD } from "@/lib/req"

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null
}

export function useUpdateProfile(open: boolean) {
    const [profileLoading, setProfileLoading] = useState(false)
    const [profileSaving, setProfileSaving] = useState(false)
    const [profileError, setProfileError] = useState<string | null>(null)
    const [profileSuccess, setProfileSuccess] = useState<string | null>(null)

    const [profileEmail, setProfileEmail] = useState<string>("")
    const [profileName, setProfileName] = useState<string>("")

    // ✅ Thay đổi: Xóa position/skills, thêm addressValue
    const [addressValue, setAddressValue] = useState<string>("")

    useEffect(() => {
        if (!open) {
            setProfileError(null)
            setProfileSuccess(null)
            return
        }

        let active = true

        const loadProfile = async () => {
            try {
                setProfileLoading(true)
                setProfileError(null)
                setProfileSuccess(null)

                const user = (await GET_METHOD("/api/auth/me")) as unknown
                if (!active) return

                if (isRecord(user)) {
                    const firstName = typeof user.firstName === "string" ? user.firstName : ""
                    const lastName = typeof user.lastName === "string" ? user.lastName : ""

                    setProfileName(`${lastName} ${firstName}`.trim())
                    setProfileEmail(typeof user.email === "string" ? user.email : "")

                    // ✅ Lấy dữ liệu address dưới dạng string từ API
                    setAddressValue(typeof user.address === "string" ? user.address : "")
                }
            } catch {
                if (active) setProfileError("Không thể tải thông tin tài khoản")
            } finally {
                if (active) setProfileLoading(false)
            }
        }

        void loadProfile()

        return () => {
            active = false
        }
    }, [open])

    const handleSaveProfile = async () => {
        try {
            setProfileSaving(true)
            setProfileError(null)
            setProfileSuccess(null)

            // ✅ Gửi payload chỉ chứa address
            const res = (await PATCH_METHOD("/api/auth/me", {
                address: addressValue,
            })) as unknown

            if (isRecord(res) && res.success === false) {
                setProfileError(typeof res.message === "string" ? res.message : "Cập nhật thất bại")
                return
            }

            setProfileSuccess("Đã cập nhật thông tin tài khoản thành công")
        } catch (err: unknown) {
            const payload = (err as { response?: { data?: { message?: string } } })?.response?.data
            setProfileError(payload?.message ?? "Cập nhật thất bại")
        } finally {
            setProfileSaving(false)
        }
    }

    return {
        profileLoading,
        profileSaving,
        profileError,
        profileSuccess,
        profileEmail,
        profileName,
        addressValue,
        setAddressValue,
        handleSaveProfile,
    }
}
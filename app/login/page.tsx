"use client" // Giữ nguyên directive của bạn

import { Suspense } from "react"
import LoginForm from "@/components/account/login"
import { useLogin } from "@/hooks/useLogin"

function LoginContent() {
    const login = useLogin()
    return <LoginForm {...login} />
}
export default function LoginPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Đang tải...</div>}>
            <LoginContent />
        </Suspense>
    )
}
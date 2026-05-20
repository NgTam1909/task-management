"use client"

import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

interface LoginFormProps {
    identifier: string
    password: string
    setIdentifier: (value: string) => void
    setPassword: (value: string) => void
    handleSubmit: () => void
    loading: boolean
    error: string | null
}

export default function LoginForm({
                                      identifier,
                                      password,
                                      setIdentifier,
                                      setPassword,
                                      handleSubmit,
                                      loading,
                                      error,
                                  }: LoginFormProps) {
    const searchParams = useSearchParams()
    const redirect = searchParams.get("redirect") || "/dashboard"
    const googleLoginUrl = `/api/auth/google?redirect=${encodeURIComponent(
        redirect
    )}`
    const googleError = searchParams.get("error") === "google_auth_failed"
        ? "Đăng nhập bằng Google không thành công. Vui lòng thử lại."
        : null
    const [showPassword, setShowPassword] = useState(false)

    // Xử lý submit form
    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        handleSubmit()
    }
    const isFormValid =
        identifier.trim() !== "" &&
        password.trim() !== ""
    const displayError = error || googleError
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
            <Card className="w-full max-w-sm sm:max-w-md rounded-2xl shadow-lg border">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-semibold">
                        Đăng nhập
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Nhập thông tin tài khoản để tiếp tục
                    </p>
                </CardHeader>

                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label>Email </Label>
                            <Input
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="example@email.com"
                                className="h-11"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2 relative">
                            <Label>Password</Label>
                            <Input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Nhập mật khẩu"
                                className="h-11 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground transition"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <div className="flex justify-end">
                            <Link
                                href="/forgot-password"
                                className="text-sm text-muted-foreground hover:underline"
                            >
                                Quên mật khẩu?
                            </Link>
                        </div>



                        {/* Error */}
                        {displayError && (
                            <p className="text-sm text-red-500 text-center">
                                {displayError}
                            </p>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 rounded-xl"
                            disabled={loading || !isFormValid}                        >
                            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                        </Button>

                        <p className="text-sm text-center text-muted-foreground">
                            Chưa có tài khoản?
                            <Link href="/register" className="underline ml-1">
                                Đăng ký
                            </Link>
                        </p>
                        <div className="space-y-3">
                            <a href={googleLoginUrl}
                               className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-background px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50" >
                                <Image
                                    src="/google.png"
                                    alt="Google"
                                    width={50}
                                    height={50}
                                /> Đăng nhập bằng Google </a> </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import {useRegisterForm} from "@/hooks/useRegister";

export default function RegisterForm() {
    const {
        form,
        loading,
        error,
        success,
        fieldErrors,
        showPassword,
        showConfirmPassword,
        handleChange,
        handleSubmit,
        toggleShowPassword,
        toggleShowConfirmPassword,
        isFormValid,
    } = useRegisterForm()

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
            <Card className="w-full max-w-md shadow-xl border-0 rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-center">
                        Tạo tài khoản mới
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Họ */}
                        <div className="space-y-2">
                            <Label>Họ</Label>
                            <Input
                                value={form.lastName}
                                onChange={(e) => handleChange("lastName", e.target.value)}
                                placeholder="Nhập họ của bạn"
                            />
                            {fieldErrors.lastName && (
                                <p className="text-xs text-red-500">{fieldErrors.lastName}</p>
                            )}
                        </div>

                        {/* Tên */}
                        <div className="space-y-2">
                            <Label>Tên</Label>
                            <Input
                                value={form.firstName}
                                onChange={(e) => handleChange("firstName", e.target.value)}
                                placeholder="Nhập tên của bạn"
                            />
                            {fieldErrors.firstName && (
                                <p className="text-xs text-red-500">{fieldErrors.firstName}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={form.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                                placeholder="example@email.com"
                            />
                            {fieldErrors.email && (
                                <p className="text-xs text-red-500">{fieldErrors.email}</p>
                            )}
                        </div>

                        {/* Số điện thoại */}
                        <div className="space-y-2">
                            <Label>Số điện thoại</Label>
                            <Input
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={form.phone}
                                onChange={(e) => handleChange("phone", e.target.value)}
                                placeholder="0123456789"
                            />
                            {fieldErrors.phone && (
                                <p className="text-xs text-red-500">{fieldErrors.phone}</p>
                            )}
                        </div>

                        {/* Mật khẩu */}
                        <div className="space-y-2 relative">
                            <Label>Mật khẩu</Label>
                            <Input
                                type={showPassword ? "text" : "password"}
                                value={form.password}
                                onChange={(e) => handleChange("password", e.target.value)}
                                placeholder="Nhập mật khẩu"
                            />
                            <button
                                type="button"
                                onClick={toggleShowPassword}
                                className="absolute right-3 top-9 text-muted-foreground"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            {fieldErrors.password && (
                                <p className="text-xs text-red-500">{fieldErrors.password}</p>
                            )}
                        </div>

                        {/* Xác nhận mật khẩu */}
                        <div className="space-y-2 relative">
                            <Label>Xác nhận mật khẩu</Label>
                            <Input
                                type={showConfirmPassword ? "text" : "password"}
                                value={form.confirmPassword}
                                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                                placeholder="Nhập lại mật khẩu"
                            />
                            <button
                                type="button"
                                onClick={toggleShowConfirmPassword}
                                className="absolute right-3 top-9 text-muted-foreground"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            {fieldErrors.confirmPassword && (
                                <p className="text-xs text-red-500">{fieldErrors.confirmPassword}</p>
                            )}
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 text-center">{error}</p>
                        )}

                        {success && (
                            <p className="text-sm text-green-600 text-center">
                                {success}
                            </p>
                        )}

                        <Button
                            type="submit"
                            className="w-full rounded-xl"
                            disabled={loading || !isFormValid}
                        >
                            {loading ? "Đang đăng ký ..." : "Đăng ký"}
                        </Button>

                        <p className="text-sm text-center text-muted-foreground">
                            Đã có tài khoản?{" "}
                            <a href="/login" className="underline cursor-pointer">
                                Đăng nhập
                            </a>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
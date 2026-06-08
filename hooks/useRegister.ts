import { useState } from "react"
import { useRouter } from "next/navigation"
import {RegisterFormData} from "@/types/user";
import {AuthService} from "@/services/auth.service";
export function useRegisterForm() {
    const router = useRouter()

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const [form, setForm] = useState<RegisterFormData>({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<
        Partial<Record<keyof RegisterFormData, string>>
    >({})

    const handleChange = (field: keyof RegisterFormData, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const toggleShowPassword = () => setShowPassword(!showPassword)
    const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword)

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault()

        setError(null)
        setSuccess(null)
        setFieldErrors({})

        if (form.password !== form.confirmPassword) {
            setFieldErrors({
                confirmPassword: "Mật khẩu xác nhận không đúng!",
            })
            return
        }

        try {
            setLoading(true)

            await AuthService.register({
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                phone: form.phone,
                password: form.password,
                confirmPassword: form.confirmPassword,
            })

            setSuccess("Đăng ký thành công!")

            setTimeout(() => {
                router.push("/login")
            }, 1500)

        } catch (err: any) {
            setError(err.message)
            setFieldErrors(err.errors || {})
        } finally {
            setLoading(false)
        }
    }

    const isFormValid =
        form.firstName.trim() !== "" &&
        form.lastName.trim() !== "" &&
        form.email.trim() !== "" &&
        form.phone.trim() !== "" &&
        form.password.trim() !== "" &&
        form.confirmPassword.trim() !== ""

    return {
        // State
        form,
        loading,
        error,
        success,
        fieldErrors,
        showPassword,
        showConfirmPassword,
        // Actions
        handleChange,
        handleSubmit,
        toggleShowPassword,
        toggleShowConfirmPassword,
        // Derived
        isFormValid,
    }
}
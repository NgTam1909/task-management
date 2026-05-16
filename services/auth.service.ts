export interface LoginPayload {
    email: string
    password: string
}

export interface RegisterPayload {
    firstName: string
    lastName: string
    email: string
    phone: string
    password: string
}
export interface ApiError {
    message: string
    errors?: Record<string, string>
}
export const AuthService = {
    async login(payload: LoginPayload) {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(payload),
        })

        const data = await res.json()

        if (!res.ok) {
            throw new Error(data.message || "Login failed")
        }

        return data
    },

        async register(payload: RegisterPayload) {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(payload),
            })

            const data = await res.json()

            if (!res.ok) {
                const errors: Record<string, string> = {}

                if (data.errors) {
                    Object.entries(data.errors).forEach(([field, messages]) => {
                        if (Array.isArray(messages) && messages.length > 0) {
                            errors[field] = messages[0]
                        }
                    })
                }

                throw {
                    message: data.message || "Đăng ký thất bại",
                    errors,
                } as ApiError
            }

            return data
        },

    async logout() {
        const res = await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include",
        })

        return res.json()
    },

    async me() {
        const res = await fetch("/api/auth/me", {
            method: "GET",
            credentials: "include",
        })

        if (!res.ok) return null

        return res.json()
    },
}
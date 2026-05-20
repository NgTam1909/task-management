"use client"

import { useEffect, useMemo, useState } from "react"
import { AuthService } from "@/services/auth.service"
import { MyTasks } from "@/components/tasks/my-task"

function getGreeting(hour: number) {
    if (hour < 4) return "Hãy chú ý sức khỏe"
    if (hour < 12) return "Chào buổi sáng"
    if (hour < 18) return "Chào buổi chiều"
    if (hour < 23) return "Chào buổi tối"
    return "Hãy chú ý sức khỏe"
}

function getVietnamTime() {
    const now = new Date()
    return new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
    )
}

export default function DashboardPage() {
    const [username, setUsername] = useState("bạn")
    const vnTime = useMemo(() => getVietnamTime(), [])
    const hour = vnTime.getHours()
    const greeting = getGreeting(hour)
    const today = vnTime.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "numeric",
        month: "numeric",
        year: "numeric",
    })
    const time = vnTime.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    })

    useEffect(() => {
        let mounted = true

        AuthService.me().then((data) => {
            if (!mounted) return
            if (data?.firstName && data?.lastName) {
                setUsername(`${data.lastName} ${data.firstName}`.trim())
            }
        })

        return () => {
            mounted = false
        }
    }, [])

    return (
        <div className="w-full px-3 sm:px-6 lg:px-10 space-y-10 overflow-x-hidden">
            <div className="space-y-1 text-center">
                <h1 className="text-2xl sm:text-3xl font-bold">
                    {greeting}, {username}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {time}, {today}
                </p>
            </div>

            <div>
                <h2 className="text-lg sm:text-xl font-semibold">
                    Danh sách công việc
                </h2>
                <MyTasks />
            </div>
        </div>
    )
}

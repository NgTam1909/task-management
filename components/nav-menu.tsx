'use client'

import { useEffect, useState } from "react"
import {  Bell, HelpCircle, Search, User } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useNotification } from "@/hooks/useNotification"
import {AuthService} from "@/services/auth.service";
import NotificationList from "./account/notificationList"

type NavMenuProps = {
    onToggleSidebarAction?: () => void
    className?: string
}


export default function NavMenu({ onToggleSidebarAction, className }: NavMenuProps) {
    const router = useRouter()
    // hiển thị một phương án dự phòng ổn định trên máy chủ.
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const { notifications, logsLoading, logsError, loadNotifications } = useNotification()
    const [searchQuery, setSearchQuery] = useState("")
    const handleNotificationOpenChange = (open: boolean) => {
        if (open) {
            void loadNotifications()
        }
    }

    const handleLogout = async () => {
        await AuthService.logout()
        router.push("/login")
        router.refresh()
    }

    return (
        <nav className={cn("w-full border-b bg-background", className)}>
            <div className="flex w-full items-center justify-between px-4 py-2">
                <div className="flex items-center gap-3">
                    {onToggleSidebarAction ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggleSidebarAction}
                            aria-label="Mở sidebar"
                        >
                            <Image src="/task.png" alt="Logo" width={40} height={40} />
                        </Button>
                    ) : (
                        <Button type="button" variant="ghost" aria-label="Logo">
                            <Image src="/task.png" alt="Logo" width={100} height={100} />
                        </Button>
                    )}

                    <div className="hidden sm:block relative w-full max-w-sm">
                        <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search user / project / task"
                            className="w-full pl-8 pr-4"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key !== "Enter") return
                                const q = searchQuery.trim()
                                if (!q) return
                                router.push(`/search?q=${encodeURIComponent(q)}`)
                            }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <HelpCircle size={20} />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="end"
                            className="w-[500px] p-3"
                        >
                            <p className="mb-2 text-sm font-medium">
                                Hướng dẫn sử dụng trạng thái công việc:
                            </p>

                            <Image
                                src="/workflow.png"
                                alt="Workflow"
                                width={450}
                                height={300}
                                className="rounded-md border"
                            />
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Separator orientation="vertical" className="h-6" />

                    {mounted  ? (
                        <DropdownMenu onOpenChange={handleNotificationOpenChange}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="Thông báo">
                                    <Bell size={20} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-96">
                                <DropdownMenuLabel>Thông báo</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <NotificationList
                                    notifications={notifications}
                                    logsLoading={logsLoading}
                                    logsError={logsError}
                                />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button variant="ghost" size="icon" aria-label="Thông báo">
                            <Bell size={20} />
                        </Button>
                    )}

                    <Separator orientation="vertical" className="h-6" />

                    {mounted  ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="User menu">
                                    <User size={20} />
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem
                                    onSelect={(e) => {
                                        e.preventDefault()
                                        router.push("/account")
                                    }}
                                >
                                    Quản lý tài khoản
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-500" onClick={handleLogout}>
                                    Đăng xuất
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button variant="ghost" size="icon" aria-label="User menu">
                            <User size={20} />
                        </Button>
                    )}
                </div>
            </div>
            <div className="sm:hidden px-3 pb-2">
                <div className="relative w-full">
                    <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search..."
                        className="w-full pl-8 pr-4"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key !== "Enter") return
                            const q = searchQuery.trim()
                            if (!q) return
                            router.push(`/search?q=${encodeURIComponent(q)}`)
                        }}
                    />
                </div>
            </div>
        </nav>
    )
}

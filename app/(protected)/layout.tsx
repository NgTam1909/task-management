'use client'

import { ReactNode } from "react"
import NavMenu from "@/components/nav-menu"
import NavProjects from "@/components/nav-project"

import { Sidebar, SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import {cn} from "@/lib/utils";

function DashboardHeader() {
    const { toggleSidebar} = useSidebar()
    return <NavMenu onToggleSidebarAction={toggleSidebar} />
}

function ResponsiveNavProjects() {
    const { isMobile, open } = useSidebar()
    if (isMobile) {
        return (
            <Sidebar collapsible="offcanvas">
                <NavProjects />
            </Sidebar>
        )}

    return (
        open ? <NavProjects /> : null
    )
}
export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <SidebarProvider defaultOpen={true}>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </SidebarProvider>
    )
}
function DashboardLayoutContent({ children }: { children: ReactNode })  {
    const { open, isMobile } = useSidebar()

    return (
            <div className="flex min-h-svh w-screen flex-col bg-muted/40">
                <div className="sticky top-0 z-50 bg-background border-b">
                {/* NAV TOP */}
                <DashboardHeader />
                </div>

                <div className="flex w-full flex-1 gap-6 px-3 sm:px-4 py-6">
                    <div className={cn(
                        "transition-all duration-300",
                        !isMobile && open ? "block" : "hidden"
                    )}>
                    {/* LEFT */}
                    <ResponsiveNavProjects />
                    </div>
                    {/* CONTENT */}
                    <main className="min-w-0 w-max flex-1 pl-10">{children}</main>
                </div>
            </div>
    )
}

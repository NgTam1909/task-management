
import Link from "next/link"
import {
    Folder,
    ChevronDown,
    MoreHorizontal,
    BookUser,
    Plus,
    SquareKanban,
} from "lucide-react"

import {
    SidebarMenu,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {Project} from "@/types/project";

type Props = {
    loading: boolean
    projects: Project[]
    deletingId: string | null
    onDelete: (id: string) => void
    onOpenMembers: (project: Project) => void
    onOpenSettings: (project: Project) => void
    onOpenTask: (project: Project) => void
}

export default function ProjectList({
                                        loading,
                                        projects,
                                        deletingId,
                                        onDelete,
                                        onOpenMembers,
                                        onOpenSettings,
                                        onOpenTask,
                                    }: Props) {
    const hasProjects = projects.length > 0

    return (
        <SidebarMenu>
            {loading && (
                <SidebarMenuItem>
                    <span className="p-2">Đang tải...</span>
                </SidebarMenuItem>
            )}

            {!loading && !hasProjects && (
                <SidebarMenuItem>
                    <span className="p-2">Chưa có dự án tồn tại</span>
                </SidebarMenuItem>
            )}

            {projects.map((project) => (
                <Collapsible key={project._id}>
                    <div className="flex items-center justify-between">
                        <CollapsibleTrigger asChild>
                            <button className="flex-1 min-w-0 flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition text-left">
                                <Folder size={18} className="flex-shrink-0" />
                                <span className="flex-1 truncate">{project.title}</span>
                                <ChevronDown size={16} className="flex-shrink-0" />
                            </button>
                        </CollapsibleTrigger>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-2 hover:bg-muted rounded-lg">
                                    <MoreHorizontal size={16} />
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => onOpenMembers(project)}>
                                    <BookUser size={14} className="mr-2" />
                                    Thành viên
                                </DropdownMenuItem>

                                <DropdownMenuItem onSelect={() => onOpenSettings(project)}>
                                    Cập nhật
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    className="text-red-500"
                                    disabled={deletingId === project.projectId}
                                    onSelect={() => onDelete(project.projectId)}
                                >
                                    {deletingId === project.projectId
                                        ? "Đang xóa dự án"
                                        : "Xóa"}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <CollapsibleContent className="ml-6 mt-1 space-y-1">
                        <div className="flex items-center gap-1">
                            <Link
                                href={`/project/${project.projectId}/tasks`}
                                className="flex flex-1 items-center gap-2 p-2 rounded-lg hover:bg-muted transition text-sm"
                            >
                                <SquareKanban size={16} />
                                Tasks
                            </Link>

                            <button
                                type="button"
                                className="p-2 rounded-lg hover:bg-muted transition"
                                onClick={() => onOpenTask(project)}
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        <Link
                            href={`/project/${project.projectId}/stats`}
                            className="flex w-full items-center gap-2 p-2 rounded-lg hover:bg-muted transition text-sm"
                        >
                            Thống kê
                        </Link>
                    </CollapsibleContent>
                </Collapsible>
            ))}
        </SidebarMenu>
    )
}
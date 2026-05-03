'use client';

import {Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
    Home,
    Plus,
} from "lucide-react";

import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarContent,
} from "@/components/ui/sidebar";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import CreateProject from "@/components/projects/create-project";
import EditProject from "@/components/projects/edit-project";
import CreateTaskForm from "@/components/tasks/create-task";
import { MemberDialog } from "@/components/projects/member-project";
import { useProjectList} from "@/hooks/useProjectList"
import ProjectList from "@/components/projects/project-list";
function NavProjectsContent() {
    const nav = useProjectList()
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const projects = nav.projects;
    const [taskDialogProjectId, setTaskDialogProjectId] = useState<string | null>(null);
    const [taskDialogProjectTitle, setTaskDialogProjectTitle] = useState<string | null>(null);
    const [taskDialogParentId, setTaskDialogParentId] = useState<string | null>(null);

    useEffect(() => {
        const shouldOpenCreateTask = searchParams.get("createTask") === "1";
        const routeParentId = searchParams.get("parentId");
        if (!shouldOpenCreateTask || projects.length === 0) return;

        const match = pathname.match(/^\/project\/([^/]+)\/tasks$/);
        const routeProjectId = match?.[1];
        if (!routeProjectId) return;

        const project = projects.find((item) => item.projectId === routeProjectId);
        if (!project) return;

        setTaskDialogProjectId(project._id);
        setTaskDialogProjectTitle(project.title);
        setTaskDialogParentId(routeParentId);
    }, [pathname, projects, searchParams]);

    return (
        <SidebarContent className="w-fit flex-none min-w-[200px] max-w-[280px]">
            <SidebarGroup>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/dashboard">
                                <Home size={16} />
                                <span>Trang chủ</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
                <SidebarGroupLabel>Dự án</SidebarGroupLabel>
                <ProjectList
                    loading={nav.loading}
                    projects={nav.projects}
                    deletingId={nav.deletingId}
                    onDelete={nav.handleDelete}
                    onOpenMembers={nav.openMembersDialog}
                    onOpenSettings={nav.openSettingsDialog}
                    onOpenTask={nav.openTaskDialog}
                />
            </SidebarGroup>

            <SidebarGroup>
                <SidebarMenu>
                    <SidebarMenuItem>
                        {nav.mounted ? (
                            <Dialog open={nav.open} onOpenChange={nav.setOpen}>
                                <DialogTrigger asChild>
                                    <SidebarMenuButton>
                                        <Plus size={16} />
                                        <span>Tạo dự án mới</span>
                                    </SidebarMenuButton>
                                </DialogTrigger>

                                <DialogContent className="sm:max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle>Tạo dự án mới</DialogTitle>
                                    </DialogHeader>

                                    <CreateProject
                                        onSuccessAction={nav.handleCreated}
                                    />
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <SidebarMenuButton>
                                <Plus size={16} />
                                <span>Tạo dự án mới</span>
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>

            {/* dialog tạo task */}
            <Dialog
                open={!!nav.taskDialogProjectId}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) {
                        nav.closeTaskDialog()
                    }
                }}
            >
                <DialogContent className="sm:max-w-xl my-6">
                    <DialogHeader>
                        <DialogTitle>
                            {nav.taskDialogProjectTitle
                                ? `Tạo task - ${nav.taskDialogProjectTitle}`
                                : "Tạo task"}
                        </DialogTitle>
                    </DialogHeader>

                    {nav.taskDialogProjectId && (
                        <CreateTaskForm
                            projectId={nav.taskDialogProjectId}
                            parentId={nav.taskDialogParentId ?? undefined}
                            onCreatedAction={() => {
                                nav.closeTaskDialog()
                                window.dispatchEvent(
                                    new CustomEvent("task:created")
                                )
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <MemberDialog
                open={!!nav.memberDialogProjectId}
                onOpenChange={(open) => {
                    if (!open) {
                        nav.closeMemberDialog()
                    }
                }}
                projectId={nav.memberDialogProjectId}
                projectTitle={nav.memberDialogProjectTitle}
                isPublic={nav.memberDialogProjectIsPublic}
            />

            <Dialog
                open={!!nav.settingsDialogProjectId}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) {
                        nav.closeSettingsDialog()
                    }
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {nav.settingsDialogProjectTitle
                                ? `Cài đặt - ${nav.settingsDialogProjectTitle}`
                                : "Cài đặt"}
                        </DialogTitle>
                    </DialogHeader>

                    {nav.settingsDialogProjectId && (
                        <EditProject
                            projectId={nav.settingsDialogProjectId}
                            onSuccessAction={nav.handleProjectUpdated}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </SidebarContent>
    );
}
export default function NavProjects() {
    return (
        <Suspense fallback={null}>
            <NavProjectsContent />
        </Suspense>
    );
}
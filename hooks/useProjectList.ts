'use client'

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useHydrated } from "@/hooks/use-hydrated"
import {
    deleteProjectService,
    getProjectsService,
} from "@/services/project.service"
import type {Project} from "@/types/project"
import {toast} from "sonner";

export function useProjectList() {
    const pathname = usePathname()
    const router = useRouter()
    const searchParams = useSearchParams()

    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)

    const [taskDialogProjectId, setTaskDialogProjectId] = useState<string | null>(null)
    const [taskDialogProjectTitle, setTaskDialogProjectTitle] = useState<string | null>(null)
    const [taskDialogParentId, setTaskDialogParentId] = useState<string | null>(null)

    const [memberDialogProjectId, setMemberDialogProjectId] = useState<string | null>(null)
    const [memberDialogProjectTitle, setMemberDialogProjectTitle] = useState<string | null>(null)
    const [memberDialogProjectIsPublic, setMemberDialogProjectIsPublic] = useState<boolean | null>(null)

    const [settingsDialogProjectId, setSettingsDialogProjectId] = useState<string | null>(null)
    const [settingsDialogProjectTitle, setSettingsDialogProjectTitle] = useState<string | null>(null)

    const [deletingId, setDeletingId] = useState<string | null>(null)

    const mounted = useHydrated()

    const loadProjects = async () => {
        try {
            const data = await getProjectsService()
            setProjects(data)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        let active = true

        const load = async () => {
            try {
                const data = await getProjectsService()
                if (active) setProjects(data)
            } finally {
                if (active) setLoading(false)
            }
        }

        load()

        return () => {
            active = false
        }
    }, [])
    useEffect(() => {
        const handleRefresh = () => {
            loadProjects()
        }
        window.addEventListener('project:joined', handleRefresh)

        return () => {
            window.removeEventListener('project:joined', handleRefresh)
        }
    }, [])
    const handleCreated = async () => {
        toast.success("Dự án đã được tạo")
        setOpen(false)
        setLoading(true)
        await loadProjects()
    }

    const handleDelete = async (projectId: string | undefined) => {
        if (!projectId) {
            toast.error("Project ID không hợp lệ")
            return
        }

        const ok = window.confirm(
            "Xác định xóa dự án này? Thao tác không thể hoàn tác"
        )

        if (!ok) return

        setDeletingId(projectId)

        try {
            await deleteProjectService(projectId)

            setProjects((prev) =>
                prev.filter((p) => p.projectId !== projectId)
            )

            toast.success("Xóa dự án thành công")

        } catch {
            toast.error("Xóa dự án thất bại")
        } finally {
            setDeletingId(null)
        }
    }

    const openTaskDialog = (project: Project) => {
        setTaskDialogProjectId(project._id)
        setTaskDialogProjectTitle(project.title)
        setTaskDialogParentId(null)
    }

    useEffect(() => {
        const shouldOpenCreateTask = searchParams.get("createTask") === "1"
        const routeParentId = searchParams.get("parentId")

        if (!shouldOpenCreateTask || projects.length === 0) return

        const match = pathname.match(/^\/project\/([^/]+)\/tasks$/)
        const routeProjectId = match?.[1]

        if (!routeProjectId) return

        const project = projects.find((item) => item.projectId === routeProjectId)

        if (!project) return

        setTaskDialogProjectId(project._id)
        setTaskDialogProjectTitle(project.title)
        setTaskDialogParentId(routeParentId)
    }, [pathname, projects, searchParams])

    const openMembersDialog = (project: Project) => {
        setMemberDialogProjectId(project.projectId)
        setMemberDialogProjectTitle(project.title)
        setMemberDialogProjectIsPublic(project.isPublic)
    }

    const openSettingsDialog = (project: Project) => {
        setSettingsDialogProjectId(project.projectId)
        setSettingsDialogProjectTitle(project.title)
    }

    const handleProjectUpdated = async () => {
        toast.success("Cập nhật dự án thành công")
        setSettingsDialogProjectId(null)
        setSettingsDialogProjectTitle(null)
        setLoading(true)
        await loadProjects()
    }

    const closeTaskDialog = () => {
        setTaskDialogProjectId(null)
        setTaskDialogProjectTitle(null)
        setTaskDialogParentId(null)

        if (searchParams.get("createTask") === "1") {
            router.replace(pathname)
        }
    }
    const closeMemberDialog = () => {
        setMemberDialogProjectId(null)
        setMemberDialogProjectTitle(null)
        setMemberDialogProjectIsPublic(null)
    }

    const closeSettingsDialog = () => {
        setSettingsDialogProjectId(null)
        setSettingsDialogProjectTitle(null)
    }
    return {
        pathname,
        router,
        searchParams,
        mounted,

        projects,
        loading,
        open,
        setOpen,

        deletingId,

        taskDialogProjectId,
        taskDialogProjectTitle,
        taskDialogParentId,

        memberDialogProjectId,
        memberDialogProjectTitle,
        memberDialogProjectIsPublic,

        settingsDialogProjectId,
        settingsDialogProjectTitle,

        handleCreated,
        handleDelete,
        openTaskDialog,
        openMembersDialog,
        openSettingsDialog,
        handleProjectUpdated,
        closeTaskDialog,
        closeMemberDialog,
        closeSettingsDialog,
    }
}
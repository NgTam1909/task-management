'use client'

import { useParams } from "next/navigation"
import SmartDashboard from "@/components/projects/stas-project"
import {GET_METHOD} from "@/lib/req";
import {useEffect, useState} from "react";

export default function ProjectStatsPage() {
    const params = useParams<{ projectId: string }>()
    const projectId = params?.projectId
    const [projectName, setProjectName] = useState<string>("")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!projectId) return

        const fetchProject = async () => {
            try {
                const data = await GET_METHOD(`/api/projects/${projectId}`)
                setProjectName(data.title || "Dự án")
            } catch {
                setProjectName("Dự án")
            } finally {
                setLoading(false)
            }
        }

        fetchProject()
    }, [projectId])

    if (!projectId) {
        return <p className="text-sm text-muted-foreground">Thiếu projectId.</p>
    }
    return (
        <div className="space-y-6">
            <section className="space-y-2">
                <h1 className="text-xl font-semibold">Thống kê dự án</h1>
                {loading ? (
                    <p className="text-sm text-muted-foreground">Đang tải...</p>
                ) : (
                    <p className="text-sm text-muted-foreground">{projectName}</p>
                )}
            </section>
            <SmartDashboard projectId={projectId} />
        </div>
    )
}

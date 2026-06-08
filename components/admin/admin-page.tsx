"use client";
import {
    Users,
    FolderKanban,
    Archive,
    FolderOpenDot,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/admin/user-management";
import { ProjectManagement } from "@/components/admin/project-management";
import {adminService} from "@/services/admin.service";
import {useEffect, useState} from "react";
import {AdminStats} from "@/types/admin";

export default function AdminPageContent() {
    const [mounted, setMounted] = useState(false);

    const [stats, setStats] = useState<AdminStats | null>(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setMounted(true);
    }, []);
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data =
                    await adminService.getStats();

                setStats(data);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (!mounted) {
        return null;
    }
    const statCards = [
        {
            title: "Tổng người dùng",
            value: stats?.totalUsers ?? 0,
            icon: Users,
        },
        {
            title: "Dự án hoạt động",
            value: stats?.activeProjects ?? 0,
            icon: FolderOpenDot,
        },
        {
            title: "Tổng dự án",
            value: stats?.totalProjects ?? 0,
            icon: FolderKanban,
        },
        {
            title: "Đã xóa mềm",
            value: stats?.deletedProjects ?? 0,
            icon: Archive,
        },
    ];
    return (

        <div className="container mx-auto py-6 space-y-6">
            <h1 className="text-3xl font-bold text-center">
                Quản trị hệ thống
            </h1>
            {loading ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
        ):(
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((item) => {
                    const Icon = item.icon;

                    return (
                        <Card key={item.title}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {item.title}
                                </CardTitle>
                                <Icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">
                                    {item.value}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
            )}
            <Tabs defaultValue="users">
                <TabsList className="grid w-full grid-cols-2 h-12">
                    <TabsTrigger value="users">
                        Quản trị người dùng
                    </TabsTrigger>

                    <TabsTrigger value="projects">
                        Quản lý dữ liệu dự án
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="users">
                    <UserManagement />
                </TabsContent>

                <TabsContent value="projects">
                    <ProjectManagement />
                </TabsContent>
            </Tabs>
        </div>

    );
}
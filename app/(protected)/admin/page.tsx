"use client";
import {
    Users,
    UserCheck,
    FolderKanban,
    Archive,
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

export default function AdminPage() {
    const stats = [
        {
            title: "Tổng người dùng",
            value: 120,
            icon: Users,
        },
        {
            title: "Đang hoạt động",
            value: 115,
            icon: UserCheck,
        },
        {
            title: "Tổng dự án",
            value: 32,
            icon: FolderKanban,
        },
        {
            title: "Đã lưu trữ",
            value: 4,
            icon: Archive,
        },
    ];
    return (
        <div className="container mx-auto py-6 space-y-6">
            <h1 className="text-3xl font-bold text-center">
                Quản trị hệ thống
            </h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((item) => {
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
            <Tabs defaultValue="users">
                <TabsList className="grid w-full grid-cols-2 h-12">
                    <TabsTrigger value="users">
                        Quản trị người dùng
                    </TabsTrigger>

                    <TabsTrigger value="projects">
                        Quản trị dự án
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
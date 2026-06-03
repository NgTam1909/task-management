"use client";

import { Search, MoreHorizontal } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const projects = [
    {
        id: 1,
        name: "Thiết kế giao diện",
        owner: "Nguyễn Thị Tâm",
        tasks: 20,
        members: 20,
        type: "Public",
        status: "Active",
    },
];

export function ProjectManagement() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Danh sách dự án
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                        <Input
                            placeholder="Tìm kiếm dự án..."
                            className="pl-9"
                        />
                    </div>

                    <Button>
                        Tìm kiếm
                    </Button>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>STT</TableHead>
                            <TableHead>Tên dự án</TableHead>
                            <TableHead>Chủ dự án</TableHead>
                            <TableHead>Task</TableHead>
                            <TableHead>Thành viên</TableHead>
                            <TableHead>Loại</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {projects.map((project, index) => (
                            <TableRow key={project.id}>
                                <TableCell>{index + 1}</TableCell>

                                <TableCell className="font-medium">
                                    {project.name}
                                </TableCell>

                                <TableCell>
                                    {project.owner}
                                </TableCell>

                                <TableCell>
                                    {project.tasks}
                                </TableCell>

                                <TableCell>
                                    {project.members}
                                </TableCell>

                                <TableCell>
                                    <Badge variant="secondary">
                                        {project.type}
                                    </Badge>
                                </TableCell>

                                <TableCell>
                                    <Badge>
                                        {project.status}
                                    </Badge>
                                </TableCell>

                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>
                                                Xem chi tiết
                                            </DropdownMenuItem>

                                            <DropdownMenuItem>
                                                Lưu trữ
                                            </DropdownMenuItem>

                                            <DropdownMenuItem>
                                                Xóa dự án
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
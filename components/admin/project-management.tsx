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
import {useEffect, useState} from "react";
import {AdminProject} from "@/types/admin";
import { adminService } from "@/services/admin.service";
export function ProjectManagement() {
    const [projects, setProjects] = useState<AdminProject[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const fetchProjects = async (
        keyword = "", pageNumber = 1
    ) => {
        try {
            setLoading(true);

            const data =
                await adminService.getProjects(
                    keyword,
                    pageNumber,
                );

            setProjects(data.data ?? []);
            console.log("Tổng số trang từ API:", data.pagination.totalPages);
            setTotalPages(data.pagination.totalPages);
            setPage(pageNumber);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchProjects();
    }, []);
    const handleRestore = async (
        id: string
    ) => {
        try {
            await adminService.restoreProject(
                id
            );

            fetchProjects(search);
        } catch (error) {
            console.error(error);
        }
    };
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
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            placeholder="Tìm kiếm dự án..."
                            className="pl-9"
                        />
                    </div>
                    <Button
                        onClick={() =>
                            fetchProjects(search)
                        }
                    >
                        Tìm kiếm
                    </Button>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>STT</TableHead>
                            <TableHead>Tên dự án</TableHead>
                            <TableHead>Chủ dự án</TableHead>
                            <TableHead className="text-center">Task</TableHead>
                            <TableHead>Thành viên</TableHead>
                            <TableHead className="text-center">Loại</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-center"
                                >
                                    Đang tải...
                                </TableCell>
                            </TableRow>
                        ) : (
                            projects?.map((project, index) => (
                                <TableRow key={project._id}>
                                    <TableCell>{index + 1}</TableCell>

                                    <TableCell className="font-medium">
                                        {project.title}
                                    </TableCell>

                                    <TableCell>
                                        {project.owner}
                                    </TableCell>

                                    <TableCell className="text-center">
                                        {project.taskCount}
                                    </TableCell>

                                    <TableCell className="text-center">
                                        {project.memberCount}
                                    </TableCell>

                                    <TableCell className="text-center">
                                        <Badge
                                            variant={
                                                project.isPublic
                                                    ? "secondary"
                                                    : "secondary"
                                            }
                                        >
                                            {project.isPublic
                                                ? "Công khai"
                                                : "Riêng tư"}
                                        </Badge>
                                    </TableCell>

                                    <TableCell className="text-center">
                                        <Badge
                                            variant={
                                                project.status === "ACTIVE"
                                                    ? "default"
                                                    : "destructive"
                                            }
                                            className="text-white">
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
                                                    Xem thông tin
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        handleRestore(project._id)
                                                    }>
                                                    Khôi phục dữ liệu
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                            )}
                    </TableBody>
                </Table>
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">Trang {page} / {totalPages}</div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => fetchProjects(search, page - 1)}>
                            Trước
                        </Button>
                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => fetchProjects(search, page + 1)}>
                            Sau
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
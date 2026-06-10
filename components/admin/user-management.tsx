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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {useEffect, useState} from "react";
import {AdminUser} from "@/types/admin";
import {adminService} from "@/services/admin.service";


export function UserManagement() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setPageSize] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const fetchUsers = async (
        keyword = "", pageNumber = 1
    ) => {
        try {
            setLoading(true);

            const data =
                await adminService.getUsers(
                    keyword,
                    pageNumber,
                );

            setUsers(data.data ?? []);
            setTotalPages(data.pagination.totalPages);
            setPageSize(data.limit);
            setPage(pageNumber);

        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchUsers();
    }, []);
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Danh sách người dùng
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
                            placeholder="Tìm kiếm người dùng..."
                            className="pl-9"
                        />
                    </div>
                    <Button
                        onClick={() =>
                            fetchUsers(search)
                        }
                    >
                        Tìm kiếm
                    </Button>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>STT</TableHead>
                            <TableHead>Họ tên</TableHead>
                            <TableHead>Email</TableHead>
                            {/*<TableHead>Trạng thái</TableHead>*/}
                            <TableHead>Đăng nhập lần cuối</TableHead>
                            <TableHead className="w-15" />
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
                                users?.map((user, index) => (
                                    <TableRow key={user._id}>
                                        <TableCell>{(page - 1) * limit + index + 1}</TableCell>

                                        <TableCell>
                                            {user.lastName}
                                            {" "}
                                            {user.firstName}
                                        </TableCell>

                                        <TableCell>
                                            {user.email}
                                        </TableCell>

                                        {/*<TableCell>*/}
                                        {/*    <Badge>*/}
                                        {/*        {user.status}*/}
                                        {/*    </Badge>*/}
                                        {/*</TableCell>*/}

                                        <TableCell>
                                            {user.lastLoginAt}
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
                                                        Khóa tài khoản
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem>
                                                        Đổi vai trò
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>                                ))
                                )}
                        </TableBody>
                </Table>
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">Trang {page} / {totalPages}</div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => fetchUsers(search, page - 1)}>
                            Trước
                        </Button>
                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => fetchUsers(search, page + 1)}>
                            Sau
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
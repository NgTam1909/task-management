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

const users = [
    {
        id: 1,
        name: "Nguyễn Thị Tâm",
        email: "ngttam04@gmail.com",
        status: "Active",
        lastLogin: "12:35 16/05/2026",
    },
];

export function UserManagement() {
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
                            placeholder="Tìm kiếm người dùng..."
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
                            <TableHead>Họ tên</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Đăng nhập lần cuối</TableHead>
                            <TableHead className="w-[60px]" />
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {users.map((user, index) => (
                            <TableRow key={user.id}>
                                <TableCell>{index + 1}</TableCell>

                                <TableCell className="font-medium">
                                    {user.name}
                                </TableCell>

                                <TableCell>
                                    {user.email}
                                </TableCell>

                                <TableCell>
                                    <Badge>
                                        {user.status}
                                    </Badge>
                                </TableCell>

                                <TableCell>
                                    {user.lastLogin}
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
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
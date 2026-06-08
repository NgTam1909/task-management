// services/admin.service.ts

export const adminService = {
    async getStats() {
        const res = await fetch("/api/admin/stats");

        if (!res.ok) {
            throw new Error("Không thể lấy thống kê");
        }

        return res.json();
    },

    async getUsers(search = "") {
        const params = new URLSearchParams();

        if (search) {
            params.append("search", search);
        }

        const res = await fetch(
            `/api/admin/user?${params.toString()}`
        );

        if (!res.ok) {
            throw new Error(
                "Không thể lấy danh sách người dùng"
            );
        }

        return res.json();
    },

    async getProjects(search = "", page = 1) {
        const params = new URLSearchParams();
        if (search) {
            params.append("search", search);
        }
        params.append("page", page.toString());
        params.append("limit", "7");
        const res = await fetch(
            `/api/admin/project?${params.toString()}`
        );

        if (!res.ok) {
            throw new Error(
                "Không thể lấy danh sách dự án"
            );
        }

        return res.json();
    },

    async restoreProject(id: string) {
        const res = await fetch(
            `/api/admin/projects/${id}/restore`,
            {
                method: "PATCH",
            }
        );

        if (!res.ok) {
            throw new Error(
                "Không thể khôi phục dự án"
            );
        }

        return res.json();
    },
    // async lockUser(id: string) {
    //     const res = await fetch(
    //         `/api/admin/users/${id}/lock`,
    //         {
    //             method: "PATCH",
    //         }
    //     );
    //
    //     if (!res.ok) {
    //         throw new Error(
    //             "Không thể khóa tài khoản"
    //         );
    //     }
    //
    //     return res.json();
    // },
    //
    // async unlockUser(id: string) {
    //     const res = await fetch(
    //         `/api/admin/users/${id}/unlock`,
    //         {
    //             method: "PATCH",
    //         }
    //     );
    //
    //     if (!res.ok) {
    //         throw new Error(
    //             "Không thể mở khóa tài khoản"
    //         );
    //     }
    //
    //     return res.json();
    // },
};
export interface AdminStats {
    totalUsers: number;
    activeProjects: number;
    totalProjects: number;
    deletedProjects: number;
}

export interface AdminUser {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
    lastLoginAt: string;
}

export interface AdminProject {
    _id: string;
    title: string;
    status: string;
    createdAt: string;
    isPublic: boolean;
    owner: string;
    members: unknown[];
    taskCount: number;
    memberCount: number;
}
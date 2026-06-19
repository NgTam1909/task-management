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
    lastLoginAt?: string | null;
}

export interface AdminProject {
    _id: string;
    projectId: string;
    title: string;
    status: string;
    createdAt: string;
    isPublic: boolean;
    owner: string;
    startDate: string;
    endDate: string;
    members: unknown[];
    taskCount: number;
    memberCount: number;
}
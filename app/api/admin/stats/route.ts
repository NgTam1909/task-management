import User from "@/models/user.model";
import Project from "@/models/project.model";

export async function GET() {
    const [
        totalUsers,
        activeProjects,
        totalProjects,
        deletedProjects,
    ] = await Promise.all([
        User.countDocuments(),
        Project.countDocuments({
            isActive: true,
        }),
        Project.countDocuments(),
        Project.countDocuments({
            isActive: false,
        }),
    ]);
    return Response.json({
        totalUsers,
        activeProjects,
        totalProjects,
        deletedProjects,
    });
}
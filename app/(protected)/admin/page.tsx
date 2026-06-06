import { redirect } from "next/navigation"
import {getCurrentUser} from "@/lib/jwt";
import AdminPageContent from "@/components/admin/admin-page";

export default async function AdminPage() {
    const user = await getCurrentUser()
    if (!user?.isGod) {
        redirect("/dashboard")
    }

    return (
        <AdminPageContent />
    )
}
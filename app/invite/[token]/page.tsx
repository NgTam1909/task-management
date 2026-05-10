"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GET_METHOD, POST_METHOD } from "@/lib/req";
import { InviteInfo } from "@/types/project"


export default function InvitePage() {
    const params = useParams<{ token: string }>();
    const token = params?.token;
    const [info, setInfo] = useState<InviteInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isAuthed, setIsAuthed] = useState(false);

    useEffect(() => {
        let active = true;
        const load = async () => {
            if (!token) return;
            setLoading(true);
            setError(null);
            try {
                const data = (await GET_METHOD(`/api/invites/${token}`)) as InviteInfo;
                if (active) setInfo(data);
            } catch (err: unknown) {
                const payload = (err as { response?: { data?: { message?: string } } })?.response
                    ?.data;
                if (active) setError(payload?.message ?? "Failed to load invite");
            } finally {
                if (active) setLoading(false);
            }
        };

        load();
        return () => {
            active = false;
        };
    }, [token]);

    useEffect(() => {
        let active = true;
        const checkAuth = async () => {
            try {
                await GET_METHOD("/api/auth/me");
                if (active) setIsAuthed(true);
            } catch {
                if (active) setIsAuthed(false);
            }
        };
        checkAuth();
        return () => {
            active = false;
        };
    }, []);

    const handleAccept = async () => {
        if (!token) return;
        setAccepting(true);
        setError(null);
        try {
            const data = (await POST_METHOD(`/api/invites/${token}`, {})) as {
                projectId?: string;
                projectTitle?: string;
            };
            setSuccess(data?.projectTitle ? `Joined ${data.projectTitle}` : "Invite accepted");
            window.dispatchEvent(new Event('project:joined'));
            if (data?.projectId) {
                setInfo((prev) =>
                    prev
                        ? {
                              ...prev,
                              projectId: data.projectId ?? prev.projectId,
                          }
                        : prev
                );
            }
        } catch (err: unknown) {
            const payload = (err as { response?: { data?: { message?: string } } })?.response
                ?.data;
            setError(payload?.message ?? "Failed to accept invite");
        } finally {
            setAccepting(false);
        }
    };

    const redirectUrl = token ? `/login?redirect=/invite/${token}` : "/login";

    return (
        <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center gap-6 p-6">
            <div className="space-y-2">
                <h1 className="text-2xl font-semibold">Thư mời tham gia dự án</h1>
                <p className="text-sm text-muted-foreground">
                    Hãy chấp nhận lời mời này để tham gia dự án..
                </p>
            </div>

            {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {!loading && error && (
                <p className="text-sm text-red-500" role="alert">
                    {error}
                </p>
            )}

            {!loading && info && (
                <div className="space-y-4 rounded-lg border bg-background p-4">
                    <div>
                        <div className="text-sm text-muted-foreground">Project</div>
                        <div className="text-base font-medium">{info.projectTitle}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Invited email: {info.email}
                    </div>

                    {!isAuthed && (
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Vui lòng đăng nhập bằng email được mời để xác nhận tham gia.
                            </p>
                            <Button asChild>
                                <Link href={redirectUrl}>Go to login</Link>
                            </Button>
                        </div>
                    )}

                    {isAuthed && (
                        <div className="space-y-2">
                            <Button onClick={handleAccept} disabled={accepting}>
                                {accepting ? "Accepting..." : "Accept invitation"}
                            </Button>
                            {success && (
                                <div className="text-xs text-green-600">{success}</div>
                            )}
                            {info.projectId && success && (
                                <Button asChild variant="outline">
                                    <Link href={`/project/${info.projectId}/tasks`}>
                                        Đi tới dự án
                                    </Link>
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

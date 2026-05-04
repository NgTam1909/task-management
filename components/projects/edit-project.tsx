"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
    updateProjectSchema,
    UpdateProjectInput,
} from "@/lib/validations/project.validation"

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { GET_METHOD, PATCH_METHOD } from "@/lib/req"
import {ProjectDetail} from "@/types/project";

type EditProjectProps = {
    projectId: string
    onSuccessAction?: () => void
}

export default function EditProject({ projectId, onSuccessAction }: EditProjectProps) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const form = useForm<UpdateProjectInput>({
        resolver: zodResolver(updateProjectSchema),
        defaultValues: {
            title: "",
            projectId: "",
            description: "",
            visibility: "private",
        },
    })

    useEffect(() => {
        let active = true

        const load = async () => {
            if (!projectId) return
            setLoading(true)
            setError(null)
            try {
                const data = (await GET_METHOD(
                    `/api/projects/${projectId}`
                )) as ProjectDetail
                if (!active) return
                form.reset({
                    title: data.title ?? "",
                    projectId: data.projectId ?? "",
                    description: data.description ?? "",
                    visibility: data.isPublic ? "public" : "private",
                })
            } catch (err: unknown) {
                const payload = (err as { response?: { data?: { message?: string } } })?.response
                    ?.data
                if (active) {
                    setError(payload?.message ?? "Không tải được dự án")
                }
            } finally {
                if (active) setLoading(false)
            }
        }

        load()

        return () => {
            active = false
        }
    }, [projectId, form])

    async function onSubmit(data: UpdateProjectInput) {
        setError(null)
        try {
            await PATCH_METHOD(`/api/projects/${projectId}`, data)
            onSuccessAction?.()
        } catch (err: unknown) {
            const payload = (err as { response?: { data?: { message?: string } } })?.response?.data
            setError(payload?.message ?? "Cập nhật thất bại")
        }
    }

    return (
        <div className="border rounded-xl p-6 bg-background shadow-sm">
            {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-5"
                    >
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên dự án</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Tên dự án" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="projectId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mã dự án</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="VD: DA001, PROJECT-ABC, ..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mô tả</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Hãy mô tả về dự án"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="visibility"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between border rounded-lg p-4">
                                    <div>
                                        <FormLabel>Công khai</FormLabel>
                                        <p className="text-sm text-muted-foreground">
                                            Mọi người có thể tham gia dự án qua đường dẫn                                        </p>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value === "public"}
                                            onCheckedChange={(checked) =>
                                                field.onChange(checked ? "public" : "private")
                                            }
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        {error && (
                            <p className="text-sm text-red-500" role="alert">
                                {error}
                            </p>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={form.formState.isSubmitting}
                        >
                            {form.formState.isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </form>
                </Form>
            )}
        </div>
    )
}

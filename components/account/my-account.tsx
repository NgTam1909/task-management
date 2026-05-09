'use client'

import { useEffect, useMemo, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import UpdateProfileDialog from "@/components/account/updateProfile"
import { Mail, MapPin, Phone, User } from "lucide-react"
import { IUser } from "@/types/user"

interface UserProfileProps {
    user: IUser
    isEditable?: boolean
    onSave?: (data: Partial<IUser>) => Promise<void>
}

export default function UserProfile({ user, isEditable = false, onSave }: UserProfileProps) {
    const [editOpen, setEditOpen] = useState(false)
    const [profileError, setProfileError] = useState<string | null>(null)
    const [profileSuccess, setProfileSuccess] = useState<string | null>(null)

    const initialFormData = useMemo(
        () => ({
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            address: user.address || "", // Address bây giờ là string
        }),
        [user.firstName, user.lastName, user.phone, user.address]
    )
    const [formData, setFormData] = useState(initialFormData)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!editOpen) {
            setFormData(initialFormData)
            setProfileError(null)
            setProfileSuccess(null)
        }
    }, [editOpen, initialFormData])

    const getInitials = () => {
        return `${user.lastName.charAt(0)}${user.firstName.charAt(0)}`.toUpperCase()
    }

    const getFullName = () => {
        return `${user.lastName} ${user.firstName}`
    }

    const handleSave = async () => {
        if (!onSave) return

        setIsLoading(true)
        setProfileError(null)
        try {
            await onSave({
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                address: formData.address,
            })
            setEditOpen(false)
        } catch (error) {
            setProfileError("Lưu thất bại. Vui lòng thử lại.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        setFormData(initialFormData)
        setProfileError(null)
        setProfileSuccess(null)
    }

    return (
        <div className="container mx-auto max-w-5xl p-3 sm:p-6">
            <Card className="overflow-hidden">
                <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                            <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                                <AvatarFallback className="text-lg sm:text-2xl bg-primary text-primary-foreground">
                                    {getInitials()}
                                </AvatarFallback>
                            </Avatar>

                            <div>
                                <CardTitle className="text-xl sm:text-2xl break-words">
                                    {getFullName()}
                                </CardTitle>
                                <CardDescription className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 mt-1 text-xs sm:text-sm">
                                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                    <span className="break-all">{user.email}</span>
                                </CardDescription>
                                {user.isGod && (
                                    <Badge variant="destructive" className="mt-1 sm:mt-2 text-xs">
                                        Super Admin
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {isEditable && (
                            <Button
                                onClick={() => setEditOpen(true)}
                                variant="outline"
                                disabled={!onSave}
                                size="sm"
                                className="w-full sm:w-auto"
                            >
                                <User className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                Chỉnh sửa hồ sơ
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <Separator />

                <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
                    <Tabs defaultValue="info" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-auto p-1 mb-4 sm:mb-6">
                            <TabsTrigger value={"info"} className="text-xs sm:text-sm py-1.5 sm:py-2">
                                Thông tin cá nhân
                            </TabsTrigger>
                            <TabsTrigger value="address" className="text-xs sm:text-sm py-1.5 sm:py-2">
                                Địa chỉ liên hệ
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab thông tin cá nhân */}
                        <TabsContent value="info" className="space-y-3 sm:space-y-4 pt-3 sm:pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <div className="space-y-1">
                                    <Label>Họ</Label>
                                    <div className="text-sm sm:text-base font-medium">{user.lastName}</div>
                                </div>

                                <div className="space-y-1">
                                    <Label >Tên</Label>
                                    <div className="text-sm sm:text-base font-medium">{user.firstName}</div>
                                </div>

                                <div className="space-y-1">
                                    <Label>Số điện thoại</Label>
                                    <div className="flex items-center gap-2 text-sm sm:text-base">
                                        <Phone className="h-4 w-4 text-primary/70" />
                                        <span>{user.phone}</span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label>Email tài khoản</Label>
                                    <div className="flex items-center gap-2 text-sm sm:text-base">
                                        <Mail className="h-4 w-4 text-primary/70" />
                                        <span className="break-all">{user.email}</span>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Tab địa chỉ - Rút gọn */}
                        <TabsContent value="address" className="pt-3 sm:pt-4">
                            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border">
                                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                <div className="space-y-1">
                                    <Label>Địa chỉ hiện tại</Label>
                                    <p className="text-sm sm:text-base break-words leading-relaxed">
                                        {user.address || "Chưa cập nhật thông tin địa chỉ"}
                                    </p>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <UpdateProfileDialog
                title="Cập nhật hồ sơ"
                open={editOpen}
                onOpenChangeAction={(open) => {
                    setEditOpen(open)
                    if (!open) handleCancel()
                }}
                profileLoading={false}
                profileSaving={isLoading}
                profileName={getFullName()}
                profileEmail={user.email}
                firstNameValue={formData.firstName}
                setFirstNameValueAction={(v) => setFormData({ ...formData, firstName: v })}
                lastNameValue={formData.lastName}
                setLastNameValueAction={(v) => setFormData({ ...formData, lastName: v })}
                phoneValue={formData.phone}
                setPhoneValueAction={(v) => setFormData({ ...formData, phone: v })}
                addressValue={formData.address}
                setAddressValueAction={(v) => setFormData({ ...formData, address: v })}
                profileError={profileError}
                profileSuccess={profileSuccess}
                onSaveAction={handleSave}
            />
        </div>
    )
}
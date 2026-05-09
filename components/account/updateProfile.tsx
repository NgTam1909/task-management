'use client'

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type Props = {
    title?: string
    open: boolean
    onOpenChangeAction: (v: boolean) => void

    profileLoading: boolean
    profileSaving: boolean

    profileName: string
    profileEmail: string

    firstNameValue?: string
    setFirstNameValueAction?: (v: string) => void

    lastNameValue?: string
    setLastNameValueAction?: (v: string) => void

    phoneValue?: string
    setPhoneValueAction?: (v: string) => void

    // ✅ Thay thế position và skills bằng addressValue
    addressValue?: string
    setAddressValueAction?: (v: string) => void

    profileError: string | null
    profileSuccess: string | null

    onSaveAction: () => void | Promise<void>
}

export default function UpdateProfileDialog(props: Props) {
    return (
        <Dialog open={props.open} onOpenChange={props.onOpenChangeAction}>
            <DialogContent
                className={cn(
                    "w-[calc(100%-1rem)] sm:w-full sm:max-w-lg md:max-w-xl",
                    "rounded-lg p-4 sm:p-6",
                    "max-h-[90vh] sm:max-h-[85vh]",
                    "flex flex-col overflow-hidden"
                )}
            >
                <DialogHeader className="flex-shrink-0 pb-2 sm:pb-4">
                    <DialogTitle className="text-lg sm:text-xl">
                        {props.title || "Cập nhật thông tin cá nhân"}
                    </DialogTitle>
                </DialogHeader>

                {props.profileLoading ? (
                    <div className="flex items-center justify-center py-8 sm:py-12 flex-1">
                        <div className="text-sm text-muted-foreground">Đang tải...</div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto px-1 space-y-4 sm:space-y-5">
                        {/* Thông tin tài khoản */}
                        <div className="space-y-1 pb-2 border-b border-gray-100">
                            <div className="text-base sm:text-lg font-semibold break-words">
                                {props.profileName || "Tài khoản"}
                            </div>
                            {props.profileEmail && (
                                <div className="text-xs sm:text-sm text-muted-foreground break-all">
                                    {props.profileEmail}
                                </div>
                            )}
                        </div>

                        {/* Form Họ và Tên */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                            {props.setLastNameValueAction && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Họ</Label>
                                    <Input
                                        value={props.lastNameValue ?? ""}
                                        onChange={(e) => props.setLastNameValueAction?.(e.target.value)}
                                        className="w-full"
                                        placeholder="Nhập họ"
                                    />
                                </div>
                            )}

                            {props.setFirstNameValueAction && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Tên</Label>
                                    <Input
                                        value={props.firstNameValue ?? ""}
                                        onChange={(e) => props.setFirstNameValueAction?.(e.target.value)}
                                        className="w-full"
                                        placeholder="Nhập tên"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Số điện thoại */}
                        {props.setPhoneValueAction && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Số điện thoại</Label>
                                <Input
                                    value={props.phoneValue ?? ""}
                                    onChange={(e) => props.setPhoneValueAction?.(e.target.value)}
                                    className="w-full"
                                    placeholder="Nhập số điện thoại"
                                    type="tel"
                                />
                            </div>
                        )}

                        {/* ✅ Thay thế Vị trí/Kỹ năng bằng Địa chỉ */}
                        {props.setAddressValueAction && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Địa chỉ</Label>
                                <Input
                                    value={props.addressValue ?? ""}
                                    onChange={(e) => props.setAddressValueAction?.(e.target.value)}
                                    className="w-full"
                                    placeholder="Nhập địa chỉ của bạn"
                                />
                            </div>
                        )}

                        {/* Thông báo lỗi/thành công */}
                        {props.profileError && (
                            <div className="text-xs sm:text-sm text-red-500 bg-red-50 rounded-md p-2 sm:p-3 break-words border border-red-100">
                                {props.profileError}
                            </div>
                        )}
                        {props.profileSuccess && (
                            <div className="text-xs sm:text-sm text-green-600 bg-green-50 rounded-md p-2 sm:p-3 break-words border border-green-100">
                                {props.profileSuccess}
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="flex-shrink-0 flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 mt-2 border-t border-gray-100">
                    <Button
                        variant="secondary"
                        onClick={() => props.onOpenChangeAction(false)}
                        disabled={props.profileSaving}
                        className="w-full sm:w-auto"
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={props.onSaveAction}
                        disabled={props.profileLoading || props.profileSaving}
                        className="w-full sm:w-auto"
                    >
                        {props.profileSaving ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
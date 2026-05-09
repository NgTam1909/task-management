import { z } from "zod"
import { parsePhoneNumberFromString } from "libphonenumber-js/max"

// ✅ Tạo Schema cho Address (thay thế cho position/skills)
const addressSchema = z.preprocess((value) => {
    if (typeof value !== "string") return undefined
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : "" // Trả về chuỗi rỗng nếu người dùng xóa hết
}, z.string().max(255, "Địa chỉ tối đa 255 ký tự")).optional()

const firstNameSchema = z.preprocess((value) => {
    if (typeof value !== "string") return undefined
    return value.trim()
}, z.string().min(1, "Hãy nhập đầy đủ thông tin").max(50)).optional()

const lastNameSchema = z.preprocess((value) => {
    if (typeof value !== "string") return undefined
    return value.trim()
}, z.string().min(1, "Hãy nhập đầy đủ thông tin").max(50)).optional()

const phoneSchema = z.preprocess((value) => {
        if (typeof value !== "string") return undefined
        return value.trim()
    }, z
        .string()
        .refine((value) => {
            if (!value) return true // Cho phép trống nếu là optional
            const phone = parsePhoneNumberFromString(value, "VN")
            const type = phone?.getType()
            return (
                !!phone?.isValid() &&
                (type === "MOBILE" || type === "FIXED_LINE_OR_MOBILE")
            )
        }, "Số điện thoại không hợp lệ")
).optional()

export const registerSchema = z.object({
    firstName: z.string().min(1, "Hãy nhập đầy đủ thông tin").max(50),
    lastName: z.string().min(1, "Hãy nhập đầy đủ thông tin").max(50),
    email: z.string().email("Địa chỉ email không hợp lệ").toLowerCase(),
    phone: z
        .string()
        .trim()
        .refine((value) => {
            const phone = parsePhoneNumberFromString(value, "VN")
            const type = phone?.getType()
            return (
                !!phone?.isValid() &&
                (type === "MOBILE" || type === "FIXED_LINE_OR_MOBILE")
            )
        }, "Số điện thoại không hợp lệ"),

    // Lưu ý: Nếu trang đăng ký cũng bỏ position/skills thì hãy xóa 2 dòng dưới
    // và thay bằng address: addressSchema nếu cần.
    address: addressSchema,

    password: z.string().min(6, "Mật khẩu phải ít nhất 6 ký tự"),
    confirmPassword: z.string()
})
    .refine((data) => data.password === data.confirmPassword, {
        message: "Mật khẩu không trùng khớp",
        path: ["confirmPassword"],
    })

export const updateProfileSchema = z.object({
    firstName: firstNameSchema,
    lastName: lastNameSchema,
    phone: phoneSchema,
    address: addressSchema,
})
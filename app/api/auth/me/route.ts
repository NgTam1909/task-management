import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/models/user.model"
import { updateProfileSchema } from "@/lib/validations/auth.validation"
import { getUserIdFromRequest } from "@/lib/jwt";

export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req)
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        await dbConnect()
        // Thay đổi: Lấy trường "address", loại bỏ "position" và "skills"
        const user = await User.findById(userId).select(
            "firstName lastName phone email isGod address"
        )

        if (!user) {
            return NextResponse.json({ message: "User không tồn tại" }, { status: 404 })
        }

        return NextResponse.json(user)
    } catch (error) {
        return NextResponse.json({ message: "Lỗi hệ thống" }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req)
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json().catch(() => ({}))

        // Lưu ý: Bạn cần cập nhật updateProfileSchema trong file auth.validation.ts
        // để hỗ trợ trường "address" (string) thay vì skills/position.
        const parsed = updateProfileSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { message: "Lỗi xác thực", errors: parsed.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        const update: Record<string, any> = {}

        // Danh sách các trường cho phép cập nhật
        const fields = ["firstName", "lastName", "phone", "address"]

        fields.forEach(field => {
            // Kiểm tra xem trường đó có xuất hiện trong body gửi lên không
            if (Object.prototype.hasOwnProperty.call(body, field)) {
                const val = parsed.data[field as keyof typeof parsed.data]

                // Nếu là string, trim khoảng trắng. Nếu trống thì gán chuỗi rỗng.
                if (typeof val === "string") {
                    update[field] = val.trim()
                } else {
                    update[field] = val
                }
            }
        })

        if (Object.keys(update).length === 0) {
            return NextResponse.json({ message: "Không có dữ liệu thay đổi" }, { status: 400 })
        }

        await dbConnect()

        const nextUser = await User.findByIdAndUpdate(
            userId,
            { $set: update },
            { returnDocument: 'after', runValidators: true } // ✅ Dùng returnDocument: 'after'
        ).select("firstName lastName phone email isGod address")

        return NextResponse.json({ success: true, user: nextUser })
    } catch (error) {
        console.error("PATCH Error:", error)
        return NextResponse.json({ message: "Lỗi server" }, { status: 500 })
    }
}
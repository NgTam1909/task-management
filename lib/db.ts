import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) {
    throw new Error("MONGODB_URI chưa được cấu hình")
}
type MongooseCache = {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
};

declare global {
    var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || {
    conn: null,
    promise: null,
};

if (!global.mongoose) {
    global.mongoose = cached;
}

export const connectDB = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
             return
        }

        await mongoose.connect(MONGODB_URI)
        console.log(" Kết nối MongoDB thành công")

    } catch (error) {
        console.error("Lỗi kết nối MongoDB:", error)
        throw error
    }
}
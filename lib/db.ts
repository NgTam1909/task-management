import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Vui lòng định nghĩa biến MONGODB_URI trong file .env.local');
}

// Định nghĩa kiểu cho biến global cache
interface GlobalMongoose {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    var mongoose: GlobalMongoose | undefined;
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached!.conn) {
        return cached!.conn;
    }

    if (!cached!.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached!.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
            console.log('Kết nối MongoDB mới thành công');
            return mongooseInstance;
        });
    }

    try {
        cached!.conn = await cached!.promise;
    } catch (e) {
        cached!.promise = null;
        throw e;
    }

    return cached!.conn;
}

export default dbConnect;
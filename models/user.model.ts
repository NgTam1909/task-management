import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
    firstName: string;
    lastName: string;
    phone?: string;
    email: string;
    password?: string;
    googleId?: string;
    address?: string;
    isGod: boolean;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    checkGod(): boolean;
    comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
        },

        lastName: {
            type: String,
            required: true,
            trim: true,
        },

        phone: {
            type: String,
            required(this: IUser) {
                return !this.googleId;
            },
            default: "",
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required(this: IUser) {
                return !this.googleId;
            },
            minlength: 6,
            select: false, // không trả về mặc định
        },

        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },

        address: {
            type: String,
            trim: true,
            maxlength: 100,
        },

        isGod: {
            type: Boolean,
            default: false,
        },
        resetPasswordToken: {
            type: String,
            select: false,
        },
        resetPasswordExpires: {
            type: Date,
            select: false,
        },
        lastLoginAt: {
            type: Date,
            default: null,
        }
    },

    {
        timestamps: true,
    }
);

UserSchema.pre("save", async function () {
    if (!this.isModified("password") || !this.password) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// kiểm tra super admin
UserSchema.methods.checkGod = function (): boolean {
    return this.isGod === true;
};

// so sánh mật khẩu
UserSchema.methods.comparePassword = async function (
    candidate: string
): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidate, this.password);
};

const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;

import mongoose from "mongoose"
export interface IUser {
    _id: string
    firstName: string
    lastName: string
    phone: string
    email: string
    address?:string
    isGod: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
}
export type PopulatedUser = {
    _id: mongoose.Types.ObjectId
    firstName?: string
    lastName?: string
    email?: string
}
export interface RegisterFormData {
    firstName: string
    lastName: string
    email: string
    phone: string
    password: string
    confirmPassword: string
}
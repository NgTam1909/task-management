import mongoose, { Schema, Document } from "mongoose"

export interface ICounter extends Document {
    name: string
    seq: number
}

const CounterSchema = new Schema<ICounter>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        seq: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
)

const Counter =
    mongoose.models.Counter ||
    mongoose.model<ICounter>("Counter", CounterSchema)

export default Counter
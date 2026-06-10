import Counter from "@/models/counter.model"

export async function generateProjectId() {
    const counter = await Counter.findOneAndUpdate(
        {
            name: "project",
        },
        {
            $inc: {
                seq: 1,
            },
        },
        {
            new: true,
            upsert: true,
        }
    )

    return `PRJ${String(counter.seq).padStart(3, "0")}`
}
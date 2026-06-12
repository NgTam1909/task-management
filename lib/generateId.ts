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
export async function generateTaskCode(
    projectId: string
) {
    const counter = await Counter.findOneAndUpdate(
        {
            name: `task_${projectId}`,
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
    const projectNumber = projectId.substring(3)
    return `${projectNumber}TSK-${String(
        counter.seq
    ).padStart(3, "0")}`
}
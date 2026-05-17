import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts"
import {Item} from "@/types/stats";



type Props = {
    data: Item[]
    onSelectMonth?: (month: string) => void
}

export default function TaskMonthlyChart({
                                             data,
                                             onSelectMonth,
                                         }: Props) {
    // sort tăng dần thời gian
    const sortedData = [...data]
        .sort((a, b) => {
            const [ma, ya] = a.month.split("/").map(Number)
            const [mb, yb] = b.month.split("/").map(Number)
            return new Date(ya, ma - 1).getTime() - new Date(yb, mb - 1).getTime()
        })
        .map((item) => {
            const totalOpen  = item.opening ?? 0
            const completed = item.completed ?? 0
            const overdue = item.overdue ?? 0
            const created = item.created ?? 0
            const cancelled = item.cancelled ?? 0
            const pending = Math.max(0, totalOpen - overdue)
            return {
                ...item,
                opening: totalOpen ,
                created,
                completed,
                cancelled,
                overdue,
                pending,
            }
        })

    return (
        <ResponsiveContainer width="100%" height={340}>
            <BarChart
                data={sortedData}
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                onClick={(state) => {
                    const month = state?.activeLabel
                    if (typeof month === "string") {
                        onSelectMonth?.(month)
                    }
                }}
            >
                <CartesianGrid
                    strokeDasharray="4 4"
                    opacity={0.1}
                    vertical={false}
                />

                <XAxis
                    dataKey="month"
                    tick={{
                        fontSize: 12,
                        fontWeight: 500,
                        fill: '#6b7280'
                    }}
                    axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                    tickLine={false}
                />

                <YAxis
                    allowDecimals={false}
                    tick={{
                        fontSize: 12,
                        fontWeight: 500,
                        fill: '#6b7280'
                    }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                />

                <Tooltip
                    cursor={false}
                    content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null

                        return (
                            <div className=" bg-background rounded-lg border p-3 shadow-md">
                                <p className="font-semibold mb-2">{label}</p>

                                {payload.map((entry, index) => {
                                    const safeColor =
                                        entry.color === "#f3f4f6"
                                            ? "#6d87ed"
                                            : entry.color
                                    const displayValue =
                                        entry.dataKey === "pending"
                                            ? entry.payload.opening
                                            : entry.value
                                    return (
                                        <div key={index}>
              <span
                  style={{
                      color: safeColor,
                      fontWeight: 500,
                  }}
              >
                {entry.name}: {displayValue}
              </span>
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    }}
                />
                <Legend
                    wrapperStyle={{
                        paddingTop: "16px",
                        fontSize: "12px",
                    }}
                    iconType="circle"
                    iconSize={10}
                />

                <Bar
                    dataKey="pending"
                    stackId="a"
                    fill="#f3f4f6"
                    name="Task đang mở"
                    stroke="#9ca3af"
                    strokeWidth={1}
                    barSize={36}
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={(e: any) => {
                        const month = e?.payload?.month
                        if (month && onSelectMonth) onSelectMonth(month)
                    }}
                />
                <Bar
                    dataKey="overdue"
                    stackId="a"
                    fill="#ef4444"
                    name="Quá hạn"
                    radius={[4, 4, 0, 0]}
                />
                <Bar
                    dataKey="completed"
                    stackId="a"
                    fill="#10b981"
                    name="Task đã hoàn thành"
                    radius={[4, 4, 0, 0]}
                />


            </BarChart>
        </ResponsiveContainer>
    )
}
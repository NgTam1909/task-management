export type MonthlyItem = {
    month: string
    created: number
    completed: number
    overdue: number
    opening: number
    cancelled: number
}
export type StatsListFilter =
    | { kind: "all" }
    | { kind: "review" }
    | { kind: "done" }
    | { kind: "overdue" }
    | { kind: "cancelled" }
    | { kind: "status"; status: string }
export type Item = {
    month: string
    created: number
    completed: number
    overdue: number
    cancelled: number
    opening?: number
}
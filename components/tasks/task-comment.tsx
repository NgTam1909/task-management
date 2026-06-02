"use client"
import { Task } from "@/types/task"
import { TimelineList } from "./task-timeline"
import {useTaskDetail} from "@/hooks/useTaskDetail";
import {useState} from "react";
import { Button } from "../ui/button";
import { MessageCircleX } from "lucide-react";
import { Input } from "../ui/input";
type TaskDetailProps = {
    task: Task
}
export function TaskComment({ task }: TaskDetailProps) {
    const {
        commentValue,
        mentionUsers,
        mentionedUsers,
        setMentionedUsers,
        commentsError,
        setCommentValue,
        handleCommentSubmit,
        replyTo,
        setReplyTo,
        comments,
        timelineItems,
        auditLoading,
        commentsLoading,
        auditError,
        availableUsers,
    } = useTaskDetail(task)
    const [showMentionList, setShowMentionList] = useState(false)
    const [mentionKeyword, setMentionKeyword] = useState("")

    const filteredUsers = mentionUsers.filter(
        (user) =>
            !mentionedUsers.some((m) => m.id === user.id) &&
            user.name.toLowerCase().includes(mentionKeyword.toLowerCase())
    )
    const replyingComment = comments.find((c) => c.id === replyTo)
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="relative flex items-center gap-2">
                    {replyTo && (
                        <div className="flex items-center justify-between rounded border px-2 py-1 text-sm">
                        <span>
                            Đang trả lời{" "}
                            <span>
                                {replyingComment?.user?.name}
                            </span>
                        </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReplyTo(null)}
                            >
                                <MessageCircleX />
                            </Button>
                        </div>
                    )}
                    <Input
                        placeholder="Bình luận"
                        value={commentValue}
                        onChange={(e) => {
                            const value = e.target.value
                            setCommentValue(value)
                            setMentionedUsers((prev) =>
                                prev.filter((user) =>
                                    value.includes(`${user.name}`)
                                )
                            )
                            const match = value.match(/@([^\s@]*)$/)
                            if (match) {
                                setShowMentionList(true)
                                setMentionKeyword(match[1])
                            } else {
                                setShowMentionList(false)
                                setMentionKeyword("")
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                void handleCommentSubmit()
                            }
                        }}
                    />
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => void handleCommentSubmit()}
                        disabled={commentValue.trim().length === 0}
                    >
                        Gửi
                    </Button>
                    {showMentionList && filteredUsers.length > 0 && (
                        <div className="absolute z-50 mt-4 w-max rounded-md border bg-background shadow">
                            {filteredUsers.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    className="w-max px-3 py-2 text-left hover:bg-muted"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                        const newValue = commentValue.replace(
                                            /@\w*$/,
                                            `${user.name} `
                                        )
                                        setCommentValue(newValue)
                                        setMentionedUsers((prev) =>
                                            prev.some((u) => u.id === user.id)
                                                ? prev
                                                : [
                                                    ...prev,
                                                    {
                                                        id: user.id,
                                                        name: user.name,
                                                    },
                                                ]
                                        )
                                        setShowMentionList(false)
                                    }}
                                >
                                    {user.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {commentsError && <p className="text-sm text-red-500">{commentsError}</p>}
            </div>
            <TimelineList
                    timelineItems={timelineItems}
                    comments={comments}
                    auditLoading={auditLoading}
                    commentsLoading={commentsLoading}
                    auditError={auditError}
                    setReplyToAction={setReplyTo}
                    availableUsers={availableUsers}

            />
        </div>
    )
}
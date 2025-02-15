import { useState } from "react"
import { Pencil, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AIEditButtonProps {
    onEdit: (action: string, option?: string) => void
}

export function AIEditButton({ onEdit }: AIEditButtonProps) {
    const [action, setAction] = useState<string>("")
    const [option, setOption] = useState<string>("")

    const handleEdit = () => {
        if (action) {
            onEdit(action, option)
            setAction("")
            setOption("")
        }
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-gradient-to-r from-blue-950/50 to-purple-950/50 border-white/10 text-gray-100 hover:bg-white/10 hover:border-blue-500/50 transition-all duration-300"
                >
                    <Pencil className="w-4 h-4 mr-2" />
                    <Sparkles className="w-4 h-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 bg-black/90 border border-white/10 backdrop-blur-xl">
                <div className="grid gap-4">
                    <Select value={action} onValueChange={setAction}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                            <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border border-white/10">
                            <SelectItem value="rewrite">Rewrite</SelectItem>
                            <SelectItem value="changeLength">Change Length</SelectItem>
                            <SelectItem value="changeTone">Change Tone</SelectItem>
                            <SelectItem value="changeFormat">Change Format</SelectItem>
                        </SelectContent>
                    </Select>

                    {action === "changeLength" && (
                        <Select value={option} onValueChange={setOption}>
                            <SelectTrigger className="bg-white/5 border-white/10">
                                <SelectValue placeholder="Select length" />
                            </SelectTrigger>
                            <SelectContent className="bg-black/90 border border-white/10">
                                <SelectItem value="shorter">Make Shorter</SelectItem>
                                <SelectItem value="longer">Make Longer</SelectItem>
                            </SelectContent>
                        </Select>
                    )}

                    {action === "changeTone" && (
                        <Select value={option} onValueChange={setOption}>
                            <SelectTrigger className="bg-white/5 border-white/10">
                                <SelectValue placeholder="Select tone" />
                            </SelectTrigger>
                            <SelectContent className="bg-black/90 border border-white/10">
                                <SelectItem value="formal">Formal</SelectItem>
                                <SelectItem value="casual">Casual</SelectItem>
                                <SelectItem value="inspirational">Inspirational</SelectItem>
                                <SelectItem value="humorous">Humorous</SelectItem>
                            </SelectContent>
                        </Select>
                    )}

                    {action === "changeFormat" && (
                        <Select value={option} onValueChange={setOption}>
                            <SelectTrigger className="bg-white/5 border-white/10">
                                <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent className="bg-black/90 border border-white/10">
                                <SelectItem value="paragraph">Paragraph</SelectItem>
                                <SelectItem value="list">List</SelectItem>
                                <SelectItem value="business">Business</SelectItem>
                                <SelectItem value="academic">Academic</SelectItem>
                                <SelectItem value="poetry">Poetry</SelectItem>
                                <SelectItem value="marketing">Marketing</SelectItem>
                            </SelectContent>
                        </Select>
                    )}

                    <Button onClick={handleEdit} className="bg-purple-500 hover:bg-purple-600">
                        Apply
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}


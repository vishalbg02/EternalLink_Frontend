'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

const emojis = [
    '😀', '😂', '😍', '🤔', '😎', '👍', '👎', '❤️', '🎉', '🔥',
    '💯', '🙏', '👀', '💪', '🤦', '🤷', '🙌', '👏', '🤝', '🤗'
]

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                    😀 Add Reaction
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2">
                <div className="grid grid-cols-5 gap-2">
                    {emojis.map((emoji) => (
                        <Button
                            key={emoji}
                            variant="ghost"
                            className="h-10 w-10 p-0"
                            onClick={() => onEmojiSelect(emoji)}
                        >
                            {emoji}
                        </Button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}


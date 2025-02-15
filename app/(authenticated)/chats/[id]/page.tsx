"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"
import { apiRequest } from "@/utils/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    MapPin,
    Send,
    Paperclip,
    Download,
    Eye,
    MessageSquare,
    Zap,
    Globe,
    Shield,
    FileText,
    Brain,
    CornerUpRight,
    Smile,
    X,
    ChevronDown,
    RotateCcw,
    Sparkles,
    Info, Globe2Icon,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { AIEditButton } from "@/components/ai-edit-button"

interface MessageRequest {
    chatId: number
    content: string
    arData?: {
        latitude: number
        longitude: number
        altitude: number
    }
    replyToMessageId?: number
}

interface Message {
    id: number
    content: string
    sender?: {
        id: number
        username: string
        email: string
    }
    sentAt: string
    isEncrypted: boolean
    ipfsHash?: string
    arMessage?: {
        latitude: number
        longitude: number
        altitude: number
        expiresAt: string
    }
    file?: {
        fileName: string
        fileType: string
        fileSize: number
        fileIpfsHash: string
    }
    replyTo?: Message
    reactions: Reaction[]
    status: MessageStatus
    deliveredAt?: string
    seenAt?: string
}

interface Reaction {
    type: string
    count: number
    users: string[]
}

interface FilePreview {
    fileIpfsHash: string
    url: string
}

interface AIFeature {
    name: string
    icon: React.ReactNode
    action: (text: string) => Promise<void>
}

enum MessageStatus {
    SENT = "SENT",
    DELIVERED = "DELIVERED",
    SEEN = "SEEN",
}

const reactionEmojis = {
    thumbsUp: "👍",
    heart: "❤️",
    laugh: "😂",
    sad: "😢",
    angry: "😠",
}

export default function ChatPage() {
    const { id } = useParams()
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [isARMessage, setIsARMessage] = useState(false)
    const [arLocation, setARLocation] = useState({ latitude: 0, longitude: 0, altitude: 0 })
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [imagePreviews, setImagePreviews] = useState<FilePreview[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [aiFeatureActive, setAIFeatureActive] = useState<string | null>(null)
    const [isLanguageDialogOpen, setIsLanguageDialogOpen] = useState(false)
    const [selectedLanguage, setSelectedLanguage] = useState<string>("")
    const [pendingTranslation, setPendingTranslation] = useState(false)
    const [replyingTo, setReplyingTo] = useState<Message | null>(null)
    const [typingReply, setTypingReply] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [translatedMessages, setTranslatedMessages] = useState<{ [key: number]: string }>({})
    const [currentTranslatingId, setCurrentTranslatingId] = useState<number | null>(null)
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
    const [showScrollButton, setShowScrollButton] = useState(false)
    const [autoScroll, setAutoScroll] = useState(true)
    const scrollAreaRef = useRef<HTMLDivElement>(null)

    const languages = [
        { code: "hi", name: "Hindi" },
        { code: "bn", name: "Bengali" },
        { code: "te", name: "Telugu" },
        { code: "ta", name: "Tamil" },
        { code: "mr", name: "Marathi" },
        { code: "gu", name: "Gujarati" },
        { code: "kn", name: "Kannada" },
        { code: "ml", name: "Malayalam" },
        { code: "pa", name: "Punjabi" },
        { code: "ur", name: "Urdu" },
        { code: "fr", name: "French" },
        { code: "es", name: "Spanish" },
        { code: "de", name: "German" },
        { code: "it", name: "Italian" },
        { code: "pt", name: "Portuguese" },
        { code: "ru", name: "Russian" },
        { code: "ja", name: "Japanese" },
        { code: "ko", name: "Korean" },
        { code: "zh", name: "Chinese" },
    ]

    const aiFeatures: AIFeature[] = [
        {
            name: "Suggest",
            icon: <MessageSquare className="w-4 h-4" />,
            action: async (text) => {
                const response = await apiRequest(`/messages/suggest?context=${encodeURIComponent(text)}`, "GET")
                setNewMessage(response.data)
            },
        },
        {
            name: "Sentiment",
            icon: <Zap className="w-4 h-4" />,
            action: async (text) => {
                const response = await apiRequest(`/messages/analyze-sentiment?text=${encodeURIComponent(text)}`, "GET")
                toast.success(`Sentiment: ${response.data}`)
            },
        },
        {
            name: "Generate Image",
            icon: <Globe2Icon className="w-4 h-4" />,
            action: async (text) => {
                const response = await apiRequest(`/messages/generate-image?prompt=${encodeURIComponent(text)}`, "GET")
                setNewMessage(response.data)
            },
        },
        {
            name: "Translate",
            icon: <Globe className="w-4 h-4" />,
            action: async (text) => {
                setPendingTranslation(true)
                setIsLanguageDialogOpen(true)
            },
        },
        {
            name: "Predict",
            icon: <Brain className="w-4 h-4" />,
            action: async (text) => {
                const response = await apiRequest(`/messages/predict-next-sentence?context=${encodeURIComponent(text)}`, "GET")
                setNewMessage(newMessage + " " + response.data)
            },
        },
    ]

    const handleTranslation = async (text: string, messageId?: number) => {
        if (!selectedLanguage || !text.trim()) return

        setAIFeatureActive("Translate")

        try {
            const response = await apiRequest(
                `/messages/translate?text=${encodeURIComponent(text)}&targetLanguage=${selectedLanguage}`,
                "GET",
            )
            if (messageId) {
                setTranslatedMessages((prev) => ({ ...prev, [messageId]: response.data }))
            } else {
                setNewMessage(response.data)
            }
        } catch (error) {
            console.error("Translation error:", error)
            toast.error("Failed to translate text")
        } finally {
            setAIFeatureActive(null)
            setPendingTranslation(false)
            if (!messageId) {
                setSelectedLanguage("")
                setIsLanguageDialogOpen(false)
            }
        }
    }

    const handleRevertTranslation = (messageId: number) => {
        setTranslatedMessages((prev) => {
            const newTranslatedMessages = { ...prev }
            delete newTranslatedMessages[messageId]
            return newTranslatedMessages
        })
    }

    useEffect(() => {
        if (pendingTranslation && selectedLanguage) {
            handleTranslation(newMessage, undefined)
        }
    }, [pendingTranslation, newMessage, selectedLanguage, handleTranslation]) // Added handleTranslation to dependencies

    const handleAIFeature = async (feature: AIFeature) => {
        if (!newMessage.trim()) {
            toast.error("Please enter some text first")
            return
        }

        setAIFeatureActive(feature.name)
        try {
            await feature.action(newMessage)
        } catch (error) {
            console.error(`Error in ${feature.name} feature:`, error)
            toast.error(`Failed to ${feature.name.toLowerCase()}`)
        } finally {
            setAIFeatureActive(null)
        }
    }

    useEffect(() => {
        fetchMessages()
        const interval = setInterval(fetchMessages, 5000)
        return () => clearInterval(interval)
    }, [id])

    useEffect(() => {
        const loadImages = async () => {
            const newPreviews: FilePreview[] = []

            for (const message of messages) {
                if (message.file?.fileType.startsWith("image/")) {
                    try {
                        const response = await apiRequest(
                            `/files/download/${message.file.fileIpfsHash}`,
                            "GET",
                            null,
                            false,
                            "blob",
                        )
                        if (response && response.blob) {
                            const url = URL.createObjectURL(response.blob)
                            newPreviews.push({
                                fileIpfsHash: message.file.fileIpfsHash,
                                url,
                            })
                        }
                    } catch (error) {
                        console.error("Error loading image:", error)
                    }
                }
            }

            imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url))
            setImagePreviews(newPreviews)
        }

        loadImages()

        return () => {
            imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url))
        }
    }, [messages])

    const fetchMessages = async () => {
        try {
            const response = await apiRequest(`/messages/chat/${id}`, "GET")
            if (Array.isArray(response)) {
                setMessages(response)
            }
            setLoading(false)
        } catch (error) {
            console.error("Error fetching messages:", error)
            toast.error("Failed to load messages")
            setLoading(false)
        }
    }

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if ((!newMessage.trim() && !file) || sending) return

        setSending(true)
        try {
            const formData = new FormData()
            const messageData: MessageRequest = {
                chatId: Number(id),
                content: newMessage.trim() || "(File attachment)",
            }

            if (isARMessage) {
                messageData.arData = {
                    latitude: arLocation.latitude,
                    longitude: arLocation.longitude,
                    altitude: arLocation.altitude,
                }
            }

            if (replyingTo) {
                messageData.replyToMessageId = replyingTo.id
            }

            formData.append("message", JSON.stringify(messageData))
            if (file) {
                formData.append("file", file)
            }

            const response = await apiRequest("/messages", "POST", formData, true)

            if (response && response.success) {
                await fetchMessages()
                setNewMessage("")
                setFile(null)
                setIsARMessage(false)
                setReplyingTo(null)
                setTypingReply(false)
                toast.success(response.message || "Message sent successfully")
            } else {
                throw new Error(response.message || "Invalid response from server")
            }
        } catch (error) {
            console.error("Error sending message:", error)
            if (error instanceof Error) {
                toast.error(`Failed to send message: ${error.message}`)
            } else {
                toast.error("Failed to send message")
            }
        } finally {
            setSending(false)
        }
    }

    const handleReaction = async (messageId: number, reactionType: string) => {
        try {
            await apiRequest(`/messages/${messageId}/reactions`, "POST", { type: reactionType })
            await fetchMessages()
        } catch (error) {
            console.error("Error adding reaction:", error)
            toast.error("Failed to add reaction")
        }
    }

    const renderReactionButton = (message: Message) => {
        const hasUserReacted = message.reactions?.some((r) => r.users.includes("currentUser"))
        const totalReactions = message.reactions?.reduce((acc, r) => acc + r.count, 0) || 0

        return (
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`p-1 hover:bg-gray-700 ${hasUserReacted ? "text-blue-400" : "text-gray-400"}`}
                    >
                        {totalReactions > 0 ? (
                            <div className="flex items-center space-x-1">
                <span className="text-sm">
                  {message.reactions
                      ?.sort((a, b) => b.count - a.count)
                      .slice(0, 1)
                      .map((r) => reactionEmojis[r.type as keyof typeof reactionEmojis])
                      .join("")}
                </span>
                                {totalReactions > 1 && <span className="text-xs">{totalReactions}</span>}
                            </div>
                        ) : (
                            <Smile className="w-4 h-4" />
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                    <div className="flex space-x-2">
                        {Object.entries(reactionEmojis).map(([type, emoji]) => {
                            const reaction = message.reactions?.find((r) => r.type === type)
                            const hasReacted = reaction?.users.includes("currentUser")
                            return (
                                <Button
                                    key={type}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleReaction(message.id, type)}
                                    className={`text-lg p-1 relative ${hasReacted ? "text-blue-400" : ""}`}
                                >
                                    {emoji}
                                    {reaction && reaction.count > 1 && (
                                        <span className="absolute -top-1 -right-1 text-xs bg-gray-700 rounded-full px-1">
                      {reaction.count}
                    </span>
                                    )}
                                </Button>
                            )
                        })}
                    </div>
                </PopoverContent>
            </Popover>
        )
    }

    const renderRepliedMessage = (repliedMessage: Message) => {
        return (
            <div className="bg-gray-700 p-2 rounded-lg mb-2 text-sm">
                <span className="text-blue-400">Replying to {repliedMessage.sender?.username}:</span>
                <p className="text-gray-300 mt-1 line-clamp-2">{repliedMessage.content}</p>
            </div>
        )
    }

    useEffect(() => {
        if (autoScroll) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
        }
    }, [messages, autoScroll])

    const handleSummarize = async (messageId: number) => {
        try {
            const message = messages.find((m) => m.id === messageId)
            if (!message) return

            const response = await apiRequest(`/messages/summarize?text=${encodeURIComponent(message.content)}`, "GET")
            setTranslatedMessages((prev) => ({ ...prev, [messageId]: response.data }))
        } catch (error) {
            console.error("Summarization error:", error)
            toast.error("Failed to summarize message")
        }
    }

    const renderMessage = (message: Message) => {
        const isTranslated = translatedMessages[message.id]
        return (
            <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="group"
            >
                <div className="bg-gradient-to-br from-blue-950/30 to-purple-950/30 rounded-xl p-4 shadow-lg border border-white/10 hover:border-blue-500/50 transition-all duration-300 backdrop-blur-md hover:shadow-purple-500/10">
                    <div className="flex items-start space-x-4">
                        <Avatar className="ring-2 ring-purple-500/50 shadow-lg">
                            <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${message.sender?.username}`} />
                            <AvatarFallback className="bg-purple-500/20">
                                {message.sender?.username?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-purple-300">{message.sender?.username || "Unknown User"}</span>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-400">{new Date(message.sentAt).toLocaleString()}</span>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="p-0 h-auto"
                                                    onClick={() => handleStatusClick(message)}
                                                >
                                                    <Info className="w-4 h-4 text-blue-400" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>View message status</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <span className="text-xs text-gray-400">{renderMessageStatus(message.status)}</span>
                                </div>
                            </div>
                            {message.replyTo && renderRepliedMessage(message.replyTo)}
                            {!message.isEncrypted && message.content && (
                                <p className="text-gray-100">{translatedMessages[message.id] || message.content}</p>
                            )}
                            {message.isEncrypted && (
                                <div className="flex items-center space-x-2 text-gray-400">
                                    <Shield className="w-4 h-4" />
                                    <span className="text-sm italic">Encrypted message</span>
                                </div>
                            )}
                            {message.file && renderFileAttachment(message.file)}
                            {message.arMessage && (
                                <div className="flex items-center space-x-2 text-purple-400 text-sm">
                                    <MapPin className="w-4 h-4" />
                                    <span>
                    {message.arMessage.latitude.toFixed(6)},{message.arMessage.longitude.toFixed(6)}
                  </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-3 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {renderReactionButton(message)}
                        <div className="h-4 w-px bg-white/10" />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplyingTo(message)}
                            className="text-gray-400 hover:text-purple-400"
                        >
                            <CornerUpRight className="w-4 h-4" />
                        </Button>
                        {!message.isEncrypted && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        if (translatedMessages[message.id]) {
                                            handleRevertTranslation(message.id)
                                        } else {
                                            setSelectedLanguage("")
                                            setIsLanguageDialogOpen(true)
                                            setPendingTranslation(true)
                                            setCurrentTranslatingId(message.id)
                                        }
                                    }}
                                    className="text-gray-400 hover:text-purple-400"
                                >
                                    {translatedMessages[message.id] ? <RotateCcw className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSummarize(message.id)}
                                    className="text-gray-400 hover:text-purple-400"
                                >
                                    <FileText className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        )
    }

    const handleStatusClick = (message: Message) => {
        setSelectedMessage(message)
        setIsStatusDialogOpen(true)
    }

    const renderMessageStatus = (status: MessageStatus) => {
        switch (status) {
            case MessageStatus.SENT:
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="5 0 40 60" width="40" height="60">
                        <g transform="translate(20,30)">
                            <path
                                d="M0 -8 C 5 -8, 5 8, 10 8 C 15 8, 15 -8, 20 -8"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                            <circle cx="5" cy="-4" r="2" fill="currentColor" />
                            <circle cx="15" cy="4" r="2" fill="currentColor" />
                        </g>
                    </svg>
                )
            case MessageStatus.DELIVERED:
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="5 0 40 60" width="40" height="60">
                        {/* Adjusted transform to center icon */}
                        <g transform="translate(20,30)">
                            <circle cx="10" cy="0" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 3" />
                            <path d="M4 -4 L16 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <path d="M4 4 L16 -4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="10" cy="0" r="2" fill="currentColor" />
                        </g>
                    </svg>
                )
            case MessageStatus.SEEN:
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="5 0 40 60" width="40" height="60">
                        <g transform="translate(20,30)">
                            <path d="M0 0 C 10 -15, 10 15, 20 0" fill="none" stroke="currentColor" strokeWidth="1.5" />
                            <circle cx="0" cy="0" r="3" fill="currentColor" />
                            <circle cx="10" cy="-8" r="3" fill="currentColor" />
                            <circle cx="10" cy="8" r="3" fill="currentColor" />
                            <circle cx="20" cy="0" r="3" fill="currentColor" />
                            <path
                                d="M0 0 L10 -8 L20 0 L10 8 L0 0"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1"
                                strokeLinecap="round"
                            />
                        </g>
                    </svg>
                )
            default:
                return null
        }
    }

    const toggleARMessage = () => {
        setIsARMessage(!isARMessage)
        if (!isARMessage) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setARLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        altitude: position.coords.altitude || 0,
                    })
                },
                (error) => {
                    console.error("Error getting location:", error)
                    toast.error("Failed to get location")
                    setIsARMessage(false)
                },
            )
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const downloadFile = async (fileIpfsHash: string, fileName: string) => {
        try {
            const response = await apiRequest(`/files/download/${fileIpfsHash}`, "GET", null, false, "blob")
            if (!response || !response.blob) {
                throw new Error("Invalid response from server")
            }

            const { blob, contentType } = response
            const url = window.URL.createObjectURL(new Blob([blob], { type: contentType }))
            const link = document.createElement("a")
            link.href = url
            link.download = fileName
            document.body.appendChild(link)
            link.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(link)
            toast.success("File downloaded successfully")
        } catch (error) {
            console.error("Error downloading file:", error)
            toast.error("Failed to download file")
        }
    }

    const previewFile = async (fileIpfsHash: string, fileName: string, fileType: string) => {
        try {
            const response = await apiRequest(`/files/download/${fileIpfsHash}`, "GET", null, false, "blob")
            if (!response || !response.blob) {
                throw new Error("Invalid response from server")
            }

            const { blob, contentType } = response
            const url = window.URL.createObjectURL(new Blob([blob], { type: contentType }))

            if (fileType.startsWith("image/")) {
                const img = document.createElement("img")
                img.src = url
                img.style.maxWidth = "100%"
                img.style.maxHeight = "80vh"
                showPreviewModal(img, url)
            } else if (fileType.startsWith("video/")) {
                const video = document.createElement("video")
                video.src = url
                video.controls = true
                video.style.maxWidth = "100%"
                video.style.maxHeight = "80vh"
                showPreviewModal(video, url)
            } else if (fileType === "application/pdf") {
                const iframe = document.createElement("iframe")
                iframe.src = url
                iframe.style.width = "100%"
                iframe.style.height = "80vh"
                showPreviewModal(iframe, url)
            } else {
                toast.error("Preview not available for this file type")
                await downloadFile(fileIpfsHash, fileName)
            }
        } catch (error) {
            console.error("Error previewing file:", error)
            toast.error("Failed to preview file")
        }
    }

    const showPreviewModal = (content: HTMLElement, url: string) => {
        const modal = document.createElement("div")
        modal.style.position = "fixed"
        modal.style.top = "0"
        modal.style.left = "0"
        modal.style.width = "100%"
        modal.style.height = "100%"
        modal.style.backgroundColor = "rgba(0,0,0,0.8)"
        modal.style.display = "flex"
        modal.style.justifyContent = "center"
        modal.style.alignItems = "center"
        modal.style.zIndex = "1000"

        const closeButton = document.createElement("button")
        closeButton.innerHTML = "✕"
        closeButton.style.position = "absolute"
        closeButton.style.top = "20px"
        closeButton.style.right = "20px"
        closeButton.style.width = "40px"
        closeButton.style.height = "40px"
        closeButton.style.padding = "8px"
        closeButton.style.backgroundColor = "rgba(0, 0, 0, 0.5)"
        closeButton.style.color = "white"
        closeButton.style.border = "2px solid rgba(255, 255, 255, 0.5)"
        closeButton.style.borderRadius = "50%"
        closeButton.style.cursor = "pointer"
        closeButton.style.fontSize = "20px"
        closeButton.style.display = "flex"
        closeButton.style.alignItems = "center"
        closeButton.style.justifyContent = "center"
        closeButton.style.transition = "all 0.2s ease"

        closeButton.onmouseover = () => {
            closeButton.style.backgroundColor = "rgba(255, 255, 255, 0.2)"
            closeButton.style.transform = "scale(1.1)"
        }
        closeButton.onmouseout = () => {
            closeButton.style.backgroundColor = "rgba(0, 0, 0, 0.5)"
            closeButton.style.transform = "scale(1)"
        }

        const cleanup = () => {
            document.body.removeChild(modal)
            window.URL.revokeObjectURL(url)
        }

        closeButton.onclick = cleanup
        modal.onclick = (e) => {
            if (e.target === modal) cleanup()
        }

        modal.appendChild(content)
        modal.appendChild(closeButton)
        document.body.appendChild(modal)
    }

    const renderFileAttachment = (file: Message["file"]) => {
        if (!file) return null

        const isImage = file.fileType.startsWith("image/")
        const isPDF = file.fileType === "application/pdf"
        const isVideo = file.fileType.startsWith("video/")
        const isPreviewable = isImage || isPDF || isVideo
        const preview = imagePreviews.find((p) => p.fileIpfsHash === file.fileIpfsHash)

        return (
            <div className="mt-2 p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                        <Paperclip className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-blue-400">{file.fileName}</span>
                        <span className="text-xs text-gray-400">({Math.round(file.fileSize / 1024)} KB)</span>
                    </div>
                    <div className="flex space-x-2">
                        {isPreviewable && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => previewFile(file.fileIpfsHash, file.fileName, file.fileType)}
                                className="hover:bg-gray-700 text-blue-400"
                            >
                                <Eye className="w-4 h-4 mr-1" />
                                <span>Preview</span>
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadFile(file.fileIpfsHash, file.fileName)}
                            className="hover:bg-gray-700 text-green-400"
                        >
                            <Download className="w-4 h-4 mr-1" />
                            <span>Download</span>
                        </Button>
                    </div>
                </div>
                {isImage && preview && (
                    <div className="mt-2">
                        <img
                            src={preview.url || "/placeholder.svg"}
                            alt={file.fileName}
                            className="rounded-lg object-cover max-w-[300px] max-h-[200px]"
                        />
                    </div>
                )}
                {isVideo && (
                    <div className="mt-2">
                        <video
                            src={`/api/files/download/${file.fileIpfsHash}`}
                            controls
                            className="rounded-lg max-w-[300px] max-h-[200px]"
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>
                )}
                {isPDF && (
                    <div className="mt-2 bg-gray-700 rounded-lg p-2 text-center">
                        <span className="text-sm text-gray-300">PDF Preview Available</span>
                    </div>
                )}
            </div>
        )
    }

    const handleAIEdit = async (action: string, option?: string) => {
        if (!newMessage.trim()) {
            toast.error("Please enter some text first")
            return
        }

        setAIFeatureActive(action)
        try {
            let response
            switch (action) {
                case "rewrite":
                    response = await apiRequest(`/messages/rewrite?text=${encodeURIComponent(newMessage)}`, "POST")
                    break
                case "changeLength":
                    response = await apiRequest(
                        `/messages/change-length?text=${encodeURIComponent(newMessage)}&makeShort=${option === "shorter"}`,
                        "POST",
                    )
                    break
                case "changeTone":
                    response = await apiRequest(
                        `/messages/change-tone?text=${encodeURIComponent(newMessage)}&tone=${option}`,
                        "POST",
                    )
                    break
                case "changeFormat":
                    response = await apiRequest(
                        `/messages/change-format?text=${encodeURIComponent(newMessage)}&format=${option}`,
                        "POST",
                    )
                    break
            }
            if (response && response.success) {
                setNewMessage(response.data)
            } else {
                throw new Error(response.message || "Failed to modify text")
            }
        } catch (error) {
            console.error(`Error in ${action} feature:`, error)
            toast.error(`Failed to ${action} text`)
        } finally {
            setAIFeatureActive(null)
        }
    }

    const groupMessagesByDate = (messages: Message[]) => {
        const groups: { [key: string]: Message[] } = {}

        messages.forEach((message) => {
            const date = new Date(message.sentAt)
            const today = new Date()
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)

            let dateKey
            if (date.toDateString() === today.toDateString()) {
                dateKey = "Today"
            } else if (date.toDateString() === yesterday.toDateString()) {
                dateKey = "Yesterday"
            } else {
                dateKey = date.toLocaleDateString()
            }

            if (!groups[dateKey]) {
                groups[dateKey] = []
            }
            groups[dateKey].push(message)
        })

        return groups
    }

    useEffect(() => {
        const scrollArea = scrollAreaRef.current
        if (!scrollArea) return

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = scrollArea
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
            setShowScrollButton(!isNearBottom)
            // Remove auto-scroll setting here
        }

        scrollArea.addEventListener("scroll", handleScroll)
        return () => scrollArea.removeEventListener("scroll", handleScroll)
    }, [])

    useEffect(() => {
        if (autoScroll) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
        }
    }, [messages])

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-900">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-slate-900 via-blue-900 to-purple-900">
            <div className="container mx-auto px-4 py-8 max-w-5xl h-screen flex flex-col">
                <Card className="flex-grow overflow-hidden border-0 bg-black/20 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.3)] rounded-2xl">
                    <CardContent className="p-6 h-full flex flex-col">
                        <ScrollArea className="flex-grow pr-4 mb-4" ref={scrollAreaRef}>
                            <AnimatePresence mode="popLayout" initial={false}>
                                {Object.entries(groupMessagesByDate([...messages].reverse())).map(([date, msgs]) => (
                                    <div key={date}>
                                        <div className="sticky top-0 flex items-center justify-center py-2 z-10">
                                            <div className="bg-white/10 px-4 py-1 rounded-full text-sm text-gray-400">{date}</div>
                                        </div>
                                        <div className="space-y-4">{msgs.map(renderMessage)}</div>
                                    </div>
                                ))}
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                        </ScrollArea>

                        {showScrollButton && (
                            <Button
                                onClick={() => {
                                    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
                                    setAutoScroll(true)
                                }}
                                className="fixed bottom-24 right-8 rounded-full p-3 bg-purple-500 hover:bg-purple-600 transition-all duration-300"
                            >
                                <ChevronDown className="w-5 h-5" />
                            </Button>
                        )}
                        <form onSubmit={sendMessage} className="space-y-4 mt-4">
                            {replyingTo && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-white/5 rounded-lg p-3 flex items-center justify-between border border-white/10"
                                >
                                    <span className="text-sm text-purple-400">Replying to {replyingTo.sender?.username}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setReplyingTo(null)}
                                        className="text-gray-400 hover:text-purple-400"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </motion.div>
                            )}

                            <div className="flex gap-3">
                                <div className="flex-1 relative group">
                                    <Textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="bg-gradient-to-br from-blue-950/50 to-purple-950/50 border-2 border-white/10 hover:border-blue-500/50 focus:border-purple-950/50 border-2 border-white/10 hover:border-blue-500/50 focus:border-purple-500/50 text-gray-100 resize-none min-h-[100px] rounded-xl transition-all duration-300 placeholder:text-gray-400"
                                        maxLength={1000}
                                    />
                                    <div className="absolute right-3 bottom-3 px-2 py-1 text-xs text-gray-400 bg-black/20 rounded-md backdrop-blur-sm">
                                        {newMessage.length}/1000
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={sending}
                                    className="self-end bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 h-12 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg hover:shadow-blue-500/20"
                                >
                                    {sending ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                            <span>Sending...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <Send className="w-4 h-4" />
                                            <span>Send</span>
                                        </div>
                                    )}
                                </Button>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="bg-gradient-to-r from-blue-950/50 to-purple-950/50 border-white/10 text-gray-100 hover:bg-white/10 hover:border-blue-500/50 transition-all duration-300"
                                        >
                                            <Sparkles className="w-4 h-4 mr-2 text-blue-400" />
                                            Actions
                                            <ChevronDown className="w-4 h-4 ml-2" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56 bg-black/90 border border-white/10 backdrop-blur-xl">
                                        <div className="grid gap-2">
                                            <Button
                                                onClick={toggleARMessage}
                                                variant={isARMessage ? "secondary" : "ghost"}
                                                disabled={sending}
                                                className="justify-start text-white"
                                            >
                                                <MapPin className="w-4 h-4 mr-2" />
                                                {isARMessage ? "Cancel AR" : "Add Location"}
                                            </Button>
                                            {aiFeatures.map((feature) => (
                                                <Button
                                                    key={feature.name}
                                                    onClick={() => handleAIFeature(feature)}
                                                    variant="ghost"
                                                    disabled={sending || aiFeatureActive !== null}
                                                    className={`justify-start text-white ${aiFeatureActive === feature.name ? "bg-blue-600" : ""}`}
                                                >
                                                    {feature.icon}
                                                    <span className="ml-2">{feature.name}</span>
                                                </Button>
                                            ))}
                                            <Button
                                                onClick={() => fileInputRef.current?.click()}
                                                variant="ghost"
                                                disabled={sending}
                                                className="justify-start text-white"
                                            >
                                                <Paperclip className="w-4 h-4 mr-2" />
                                                Attach File
                                            </Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                                {file && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center space-x-2 bg-white/5 rounded-lg px-3 py-1"
                                    >
                                        <Paperclip className="w-4 h-4 text-purple-400" />
                                        <span className="text-sm text-gray-300">{file.name}</span>
                                    </motion.div>
                                )}
                                {isARMessage && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center space-x-2 bg-white/5 rounded-lg px-3 py-1"
                                    >
                                        <MapPin className="w-4 h-4 text-purple-400" />
                                        <span className="text-sm text-gray-300">
                      Location: {arLocation.latitude.toFixed(6)}, {arLocation.longitude.toFixed(6)}
                    </span>
                                    </motion.div>
                                )}
                                <AIEditButton onEdit={handleAIEdit} />
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isLanguageDialogOpen} onOpenChange={setIsLanguageDialogOpen}>
                <DialogContent className="bg-black/90 border border-white/10 backdrop-blur-xl text-white">
                    <DialogHeader>
                        <DialogTitle>Select Language for Translation</DialogTitle>
                    </DialogHeader>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                            <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border border-white/10">
                            {languages.map((lang) => (
                                <SelectItem key={lang.code} value={lang.code}>
                                    {lang.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="flex justify-end space-x-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsLanguageDialogOpen(false)}
                            className="bg-white/5 border-white/10 hover:bg-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (selectedLanguage) {
                                    if (currentTranslatingId) {
                                        const messageToTranslate = messages.find((m) => m.id === currentTranslatingId)
                                        if (messageToTranslate) {
                                            handleTranslation(messageToTranslate.content, currentTranslatingId)
                                        }
                                    } else if (newMessage.trim()) {
                                        handleTranslation(newMessage)
                                    } else {
                                        toast.error("Please enter some text to translate")
                                        return
                                    }
                                }
                                setIsLanguageDialogOpen(false)
                                if (!currentTranslatingId) {
                                    setSelectedLanguage("")
                                }
                                setCurrentTranslatingId(null)
                            }}
                            className="bg-purple-500 hover:bg-purple-600"
                        >
                            Translate
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
                <DialogContent className="bg-black/90 border border-white/10 backdrop-blur-xl text-white">
                    <DialogHeader>
                        <DialogTitle>Message Status</DialogTitle>
                    </DialogHeader>
                    {selectedMessage && (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -8 20 16" className="w-5 h-5 text-gray-400">
                                    <path
                                        d="M0 -8 C5 -8, 5 8, 10 8 C15 8, 15 -8, 20 -8"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                    <circle cx="5" cy="-4" r="2" fill="currentColor" />
                                    <circle cx="15" cy="4" r="2" fill="currentColor" />
                                </svg>
                                <p>
                                    <strong>Sent at:</strong> {new Date(selectedMessage.sentAt).toLocaleString()}
                                </p>
                            </div>
                            {selectedMessage.deliveredAt && (
                                <div className="flex items-center space-x-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -10 20 20" className="w-5 h-5 text-blue-400">
                                        <circle
                                            cx="10"
                                            cy="0"
                                            r="10"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeDasharray="2 3"
                                        />
                                        <path d="M4 -4 L16 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        <path d="M4 4 L16 -4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        <circle cx="10" cy="0" r="2" fill="currentColor" />
                                    </svg>
                                    <p>
                                        <strong>Delivered at:</strong> {new Date(selectedMessage.deliveredAt).toLocaleString()}
                                    </p>
                                </div>
                            )}
                            {selectedMessage.seenAt && (
                                <div className="flex items-center space-x-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -15 20 30" className="w-5 h-5 text-green-400">
                                        <path d="M0 0 C10 -15, 10 15, 20 0" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                        <circle cx="0" cy="0" r="3" fill="currentColor" />
                                        <circle cx="10" cy="-8" r="3" fill="currentColor" />
                                        <circle cx="10" cy="8" r="3" fill="currentColor" />
                                        <circle cx="20" cy="0" r="3" fill="currentColor" />
                                        <path
                                            d="M0 0 L10 -8 L20 0 L10 8 L0 0"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <p>
                                        <strong>Seen at:</strong> {new Date(selectedMessage.seenAt).toLocaleString()}
                                    </p>
                                </div>
                            )}
                            <p>
                                <strong>Current Status:</strong> {selectedMessage.status}
                            </p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}


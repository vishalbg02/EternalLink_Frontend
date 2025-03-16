"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useInView } from "react-intersection-observer"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"
import { apiRequest } from "@/utils/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import dynamic from "next/dynamic";
import {
    MapPin, Send, Paperclip, Download, Eye, MessageSquare, Zap, Globe, Shield, FileText, Brain, CornerUpRight, Smile, X, ChevronDown, RotateCcw, Sparkles, Info, Globe2Icon, Clock, Users, Video
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { AIEditButton } from "@/components/ai-edit-button"
import PingIndicator from "@/components/ui/PingIndicator"

// Dynamically import ARVideoHologram with SSR disabled and fallback
const ARVideoHologram = dynamic(() => import("@/components/ARVideoHologram"), {
    ssr: false,
    loading: () => <p>Loading AR Video Hologram...</p>,
});

interface MessageRequest {
    chatId: number
    content: string
    arData?: { latitude: number; longitude: number; altitude: number }
    replyToMessageId?: number
    expirationSeconds?: number
    isOneTimeView?: boolean
}

interface Message {
    id: number
    content: string
    sender?: { id: number; username: string; email: string }
    sentAt: string
    isEncrypted: boolean
    ipfsHash?: string
    arMessage?: {
        latitude: number
        longitude: number
        altitude: number
        expiresAt: string
        gestureTrigger?: string
        isViewed?: boolean
    }
    file?: { fileName: string; fileType: string; fileSize: number; fileIpfsHash: string }
    replyTo?: Message
    reactions: Reaction[]
    status: MessageStatus
    deliveredAt?: string
    seenAt?: string
    expiresAt?: string
    isOneTimeView?: boolean
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
    const [chatUsers, setChatUsers] = useState<string[]>([]);
    const [file, setFile] = useState<File | null>(null)
    const [filePreview, setFilePreview] = useState<FilePreview | null>(null)
    const [generatedImagePreview, setGeneratedImagePreview] = useState<FilePreview | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [aiFeatureActive, setAIFeatureActive] = useState<string | null>(null)
    const [isLanguageDialogOpen, setIsLanguageDialogOpen] = useState(false)
    const [selectedLanguage, setSelectedLanguage] = useState<string>("")
    const [pendingTranslation, setPendingTranslation] = useState(false)
    const [replyingTo, setReplyingTo] = useState<Message | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [translatedMessages, setTranslatedMessages] = useState<{ [key: number]: string }>({})
    const [currentTranslatingId, setCurrentTranslatingId] = useState<number | null>(null)
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
    const [showScrollButton, setShowScrollButton] = useState(false)
    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const [initialScrollDone, setInitialScrollDone] = useState(false)
    const [visibleMessages, setVisibleMessages] = useState<Set<number>>(new Set())
    const [expirationOption, setExpirationOption] = useState<string>("off")
    const [isOneTimeView, setIsOneTimeView] = useState(false)
    const [revealedOneTimeMessages, setRevealedOneTimeMessages] = useState<Set<number>>(new Set())
    const [chatExpiration, setChatExpiration] = useState<number | null>(null)
    const [imagePreviews, setImagePreviews] = useState<FilePreview[]>([])
    const [currentUser, setCurrentUser] = useState<string>("User1")
    const [connectedUser, setConnectedUser] = useState<string>("User2")
    const [isARVideoDialogOpen, setIsARVideoDialogOpen] = useState(false)
    const [recordedARVideo, setRecordedARVideo] = useState<{ blob: Blob; gestureTrigger: string } | null>(null)

    const languages = [
        { code: "hi", name: "Hindi" }, { code: "bn", name: "Bengali" }, { code: "te", name: "Telugu" },
        { code: "ta", name: "Tamil" }, { code: "mr", name: "Marathi" }, { code: "gu", name: "Gujarati" },
        { code: "kn", name: "Kannada" }, { code: "ml", name: "Malayalam" }, { code: "pa", name: "Punjabi" },
        { code: "ur", name: "Urdu" }, { code: "fr", name: "French" }, { code: "es", name: "Spanish" },
        { code: "de", name: "German" }, { code: "it", name: "Italian" }, { code: "pt", name: "Portuguese" },
        { code: "ru", name: "Russian" }, { code: "ja", name: "Japanese" }, { code: "ko", name: "Korean" },
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
                setNewMessage("")
                const response = await apiRequest(`/messages/generate-image?prompt=${encodeURIComponent(text)}`, "GET")
                if (response.data) {
                    const blob = new Blob([response.data], { type: "image/png" })
                    const formData = new FormData()
                    formData.append("file", blob, "generated-image.png")
                    const uploadResponse = await apiRequest("/files/upload", "POST", formData, true)
                    if (uploadResponse.ipfsHash) {
                        const url = URL.createObjectURL(blob)
                        setGeneratedImagePreview({ fileIpfsHash: uploadResponse.ipfsHash, url })
                    } else {
                        throw new Error("Failed to upload to IPFS")
                    }
                } else {
                    throw new Error("No image data received")
                }
            },
        },
        {
            name: "Translate",
            icon: <Globe className="w-4 h-4" />,
            action: async () => {
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

    const handleTranslation = useCallback(
        async (text: string, messageId?: number) => {
            if (!selectedLanguage || !text.trim()) return

            setAIFeatureActive("Translate")
            try {
                const response = await apiRequest(
                    `/messages/translate?text=${encodeURIComponent(text)}&targetLanguage=${selectedLanguage}`,
                    "GET"
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
        },
        [selectedLanguage]
    )

    const handleRevertTranslation = (messageId: number) => {
        setTranslatedMessages((prev) => {
            const newTranslatedMessages = { ...prev }
            delete newTranslatedMessages[messageId]
            return newTranslatedMessages
        })
    }

    useEffect(() => {
        if (pendingTranslation && selectedLanguage && newMessage.trim()) {
            handleTranslation(newMessage)
        }
    }, [pendingTranslation, selectedLanguage, newMessage, handleTranslation])

    const handleAIFeature = useCallback(
        async (feature: AIFeature) => {
            if (!newMessage.trim() && feature.name !== "Translate") {
                toast.error("Please enter some text first")
                return
            }

            setAIFeatureActive(feature.name)
            try {
                await feature.action(newMessage)
            } catch (error) {
                console.error(`Error in ${feature.name} feature:`, error)
                toast.error(`Failed to ${feature.name.toLowerCase()}`, { style: { background: "#1a1a1a", color: "#fff", border: "1px solid #333" } })
            } finally {
                setAIFeatureActive(null)
            }
        },
        [newMessage]
    )

    const fetchMessages = async () => {
        try {
            // Fetch messages
            const messageResponse = await apiRequest(`/messages/chat/${id}`, "GET");
            if (Array.isArray(messageResponse)) {
                const prevLength = messages.length;
                setMessages((prevMessages) => {
                    const hasChanges = messageResponse.some((newMsg) => {
                        const existingMsg = prevMessages.find((msg) => msg.id === newMsg.id);
                        return !existingMsg || JSON.stringify(existingMsg) !== JSON.stringify(newMsg);
                    });

                    if (!hasChanges) return prevMessages;

                    const existingMessagesMap = new Map(prevMessages.map((m) => [m.id, m]));
                    const updatedMessages = messageResponse
                        .map((newMessage) => {
                            const existingMessage = existingMessagesMap.get(newMessage.id);
                            return existingMessage ? { ...existingMessage, ...newMessage } : newMessage;
                        })
                        .filter((msg) => !(msg.isOneTimeView && msg.status === "SEEN"));
                    return updatedMessages;
                });

                // Fetch chat details
                const chatResponse = await apiRequest(`/chats`, "GET");
                const currentChat = chatResponse.find((chat: any) => chat.id === Number(id));
                setChatExpiration(currentChat?.defaultExpirationSeconds || null);

                // Fetch usernames using the new endpoint
                const usersResponse = await apiRequest(`/messages/chat/${id}/users`, "GET");
                if (usersResponse.success && Array.isArray(usersResponse.data)) {
                    const usernames = usersResponse.data;
                    setChatUsers(usernames);

                    // Assuming the first user is the current user and the second is the connected user
                    // Adjust this logic based on how you identify the current user
                    setCurrentUser(usernames[0] || "User1"); // Replace with actual logic to identify the current user
                    setConnectedUser(usernames[1] || "User2"); // The other user in the chat
                } else {
                    throw new Error("Failed to fetch chat users");
                }

                if (messageResponse.length > prevLength && messagesEndRef.current) {
                    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
                }
            }
            setLoading(false);
        } catch (error) {
            console.error("Error fetching messages or users:", error);
            toast.error("Failed to load chat data");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages()
        const interval = setInterval(fetchMessages, 5000)
        return () => clearInterval(interval)
    }, [id])

    useEffect(() => {
        const loadImages = async () => {
            const imageMessages = messages.filter((message) => message.file?.fileType.startsWith("image/"))

            const hasAllPreviews = imageMessages.every((msg) =>
                imagePreviews.some((preview) => preview.fileIpfsHash === msg.file?.fileIpfsHash)
            )

            if (hasAllPreviews) return

            const newPreviews: FilePreview[] = []

            for (const message of imageMessages) {
                if (!message.file || imagePreviews.some((p) => p.fileIpfsHash === message.file.fileIpfsHash)) continue

                try {
                    const response = await apiRequest(`/files/download/${message.file.fileIpfsHash}`, "GET", null, false, "blob")
                    if (response?.blob) {
                        const url = URL.createObjectURL(response.blob)
                        newPreviews.push({ fileIpfsHash: message.file.fileIpfsHash, url })
                    }
                } catch (error) {
                    console.error("Error loading image:", error)
                }
            }

            if (newPreviews.length > 0) {
                setImagePreviews((prev) => [...prev, ...newPreviews])
            }
        }

        loadImages()

        return () => {
            imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url))
        }
    }, [messages, imagePreviews])

    useEffect(() => {
        if (!initialScrollDone && messages.length > 0 && scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
            setInitialScrollDone(true)
        }
    }, [messages, initialScrollDone])




    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !file && !generatedImagePreview && !recordedARVideo) || sending) return;

        setSending(true);
        try {
            if (recordedARVideo) {
                // Send AR video message
                await sendARMessage(
                    Number(id),
                    arLocation,
                    recordedARVideo,
                    replyingTo,
                    expirationOption,
                    isOneTimeView
                );
            } else {
                // Handle regular messages with or without attachments
                const formData = new FormData();
                const messageData: MessageRequest = {
                    chatId: Number(id),
                    content: newMessage.trim() || (file || generatedImagePreview ? "(Attachment)" : ""),
                };

                if (isARMessage) {
                    messageData.arData = arLocation;
                }
                if (replyingTo) messageData.replyToMessageId = replyingTo.id;
                if (expirationOption !== "off") {
                    const [amount, unit] = expirationOption.split("-");
                    const numAmount = parseInt(amount);
                    switch (unit) {
                        case "minutes": messageData.expirationSeconds = numAmount * 60; break;
                        case "hours": messageData.expirationSeconds = numAmount * 60 * 60; break;
                        case "days": messageData.expirationSeconds = numAmount * 24 * 60 * 60; break;
                    }
                }
                if (isOneTimeView) messageData.isOneTimeView = true;

                formData.append("message", JSON.stringify(messageData));

                if (file) {
                    formData.append("file", file);
                } else if (generatedImagePreview) {
                    const response = await fetch(generatedImagePreview.url);
                    const blob = await response.blob();
                    formData.append("file", blob, "generated-image.png");
                }

                const response = await apiRequest("/messages", "POST", formData, true);
                if (!response || !response.success) {
                    throw new Error(response?.message || "Failed to send message");
                }
            }

            // Fetch updated messages
            await fetchMessages();

            // Reset state
            setNewMessage("");
            setFile(null);
            setFilePreview(null);
            setGeneratedImagePreview(null);
            setRecordedARVideo(null);
            setIsARMessage(false);
            setReplyingTo(null);
            setExpirationOption("off");
            setIsOneTimeView(false);
            setIsARVideoDialogOpen(false);

            toast.success("Message sent!", { style: { background: "#1a1a1a", color: "#fff", border: "1px solid #333" } });

            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            }
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error(`Failed to send message: ${error.message}`, {
                style: { background: "#1a1a1a", color: "#fff", border: "1px solid #333" },
            });
        } finally {
            setSending(false);
        }
    };

    const sendARMessage = async (
        chatId: number,
        arLocation: { latitude: number; longitude: number; altitude: number },
        recordedARVideo: { blob: Blob; gestureTrigger: string },
        replyingTo?: { id: number },
        expirationOption: string = "off",
        isOneTimeView: boolean = false
    ): Promise<boolean> => {
        try {
            const formData = new FormData();

            const messageData: MessageRequest = {
                chatId: chatId,
                content: "(AR Video Message)",
            };
            if (replyingTo) messageData.replyToMessageId = replyingTo.id;

            let expirationSeconds = null;
            if (expirationOption !== "off") {
                const [amount, unit] = expirationOption.split("-");
                const numAmount = parseInt(amount);
                switch (unit) {
                    case "minutes": expirationSeconds = numAmount * 60; break;
                    case "hours": expirationSeconds = numAmount * 60 * 60; break;
                    case "days": expirationSeconds = numAmount * 24 * 60 * 60; break;
                }
                messageData.expirationSeconds = expirationSeconds;
            }
            if (isOneTimeView) messageData.isOneTimeView = true;

            formData.append("message", JSON.stringify(messageData));

            const arMessageRequest = {
                chatId: chatId,
                latitude: arLocation.latitude,
                longitude: arLocation.longitude,
                altitude: arLocation.altitude,
                expiresAt: expirationSeconds
                    ? new Date(Date.now() + expirationSeconds * 1000).toISOString()
                    : null,
                gestureTrigger: recordedARVideo.gestureTrigger.toUpperCase(),
                // Do NOT include videoIpfsHash here
            };

            formData.append("data", JSON.stringify(arMessageRequest));
            formData.append("video", recordedARVideo.blob, "ar-video.webm");

            const response = await apiRequest("/ar-messages/video", "POST", formData, true);
            console.log("AR message response:", response);

            if (!response || !response.success) {
                throw new Error(response?.message || "Failed to send AR video message");
            }

            return true;
        } catch (error) {
            console.error("Error sending AR message:", error);
            throw error;
        }
    };

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
                        className={`p-1 hover:bg-gray-800/70 ${hasUserReacted ? "text-blue-400" : "text-gray-400"} transition-colors`}
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
                <PopoverContent className="w-auto p-2 bg-gray-900/95 border-gray-800/50 backdrop-blur-lg shadow-lg rounded-xl">
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
                                    className={`text-lg p-1 relative ${hasReacted ? "text-blue-400" : "text-gray-300"} hover:bg-gray-800/70`}
                                >
                                    {emoji}
                                    {reaction && reaction.count > 1 && (
                                        <span className="absolute -top-1 -right-1 text-xs bg-gray-700/80 rounded-full px-1 text-white">
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

    const renderRepliedMessage = (repliedMessage: Message) => (
        <div className="bg-gray-800/50 p-3 rounded-lg mb-2 text-sm border-l-4 border-blue-500/70 shadow-sm">
            <span className="text-blue-400 font-medium">Replying to {repliedMessage.sender?.username}:</span>
            <p className="text-gray-300 mt-1 line-clamp-2">{repliedMessage.content}</p>
        </div>
    )

    const handleScrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        const scrollArea = scrollAreaRef.current
        if (!scrollArea) return

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = scrollArea
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
            setShowScrollButton(!isNearBottom)
        }

        scrollArea.addEventListener("scroll", handleScroll)
        return () => scrollArea.removeEventListener("scroll", handleScroll)
    }, [messages])

    const MessageObserver = ({ messageId }: { messageId: number }) => {
        const { ref, inView } = useInView({
            threshold: 0.5,
            onChange: (inView) => {
                if (inView) setVisibleMessages((prev) => new Set([...prev, messageId]))
                else setVisibleMessages((prev) => { const newSet = new Set(prev); newSet.delete(messageId); return newSet })
            },
        })

        return <div ref={ref} className="message-observer" />
    }

    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState === "visible" && visibleMessages.size > 0) {
                const messageIds = Array.from(visibleMessages);

                try {
                    await Promise.all(
                        messageIds.map(async (messageId) => {
                            const messageExists = messages.find((msg) => msg.id === messageId);
                            if (messageExists && messageExists.status !== "SEEN") {
                                try {
                                    const result = await apiRequest(`/messages/${messageId}/status`, "PUT", { status: "SEEN" });
                                    if (!result) {
                                        console.warn(`No valid response for message ${messageId}`);
                                        return;
                                    }
                                } catch (err) {
                                    console.error(`Failed to update status for message ${messageId}:`, err);
                                    // Skip this message and continue with others
                                    return;
                                }
                            }
                        })
                    );

                    setMessages((prev) =>
                        prev.map((msg) =>
                            messageIds.includes(msg.id) && msg.status !== "SEEN"
                                ? { ...msg, status: "SEEN", seenAt: new Date().toISOString() }
                                : msg
                        )
                    );
                } catch (error) {
                    console.error("Error updating message statuses:", error);
                    toast.error("Failed to update some message statuses");
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [visibleMessages, messages]);

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

    const formatExpirationTime = (expiresAt?: string) => {
        if (!expiresAt) return ""
        const now = new Date()
        const expiration = new Date(expiresAt)
        const diffMs = expiration.getTime() - now.getTime()
        if (diffMs <= 0) return "Expired"

        const diffSeconds = Math.floor(diffMs / 1000)
        if (diffSeconds < 60) return `${diffSeconds}s`
        const diffMinutes = Math.floor(diffSeconds / 60)
        if (diffMinutes < 60) return `${diffMinutes}m`
        const diffHours = Math.floor(diffMinutes / 60)
        if (diffHours < 24) return `${diffHours}h`
        const diffDays = Math.floor(diffHours / 24)
        return `${diffDays}d`
    }

    const formatChatExpiration = (seconds: number) => {
        if (seconds < 3600) return `${seconds / 60} minutes`
        if (seconds < 86400) return `${seconds / 3600} hours`
        return `${seconds / 86400} days`
    }

    const renderMessage = (message: Message) => {
        const isExpired = message.expiresAt && new Date(message.expiresAt) <= new Date();
        const isOneTimeViewed = message.isOneTimeView && revealedOneTimeMessages.has(message.id) && message.status === "SEEN";

        if (isExpired || isOneTimeViewed) return null;

        const isRevealed = revealedOneTimeMessages.has(message.id);
        const preview = imagePreviews.find((p) => p.fileIpfsHash === message.file?.fileIpfsHash);
        const isCurrentUserSender = message.sender?.username === currentUser;
        const isARMessage = !!message.arMessage;

        const handleReveal = async () => {
            setRevealedOneTimeMessages((prev) => new Set([...prev, message.id]));
            try {
                await apiRequest(`/messages/${message.id}/status`, "PUT", { status: "SEEN" });
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === message.id ? { ...msg, status: "SEEN", seenAt: new Date().toISOString() } : msg
                    )
                );
            } catch (error) {
                console.error("Error updating message status:", error);
                toast.error("Failed to reveal message");
            }
        };

        return (
            <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="group"
            >
                <MessageObserver messageId={message.id} />
                <div className="bg-gradient-to-br from-gray-900/80 to-black/80 rounded-xl p-4 shadow-lg border border-gray-800/50 hover:border-blue-500/50 transition-all duration-300 backdrop-blur-xl hover:shadow-blue-600/20">
                    <div className="flex items-start space-x-4">
                        <Avatar className="ring-2 ring-purple-500/40 shadow-md h-10 w-10">
                            <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${message.sender?.username}`} />
                            <AvatarFallback className="bg-purple-600/30 text-white font-semibold">
                                {message.sender?.username?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-purple-300 text-sm">{message.sender?.username || "Unknown User"}</span>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-400 font-medium">{new Date(message.sentAt).toLocaleTimeString()}</span>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="p-1 h-auto hover:bg-gray-800/70"
                                                    onClick={() => handleStatusClick(message)}
                                                >
                                                    <Info className="w-4 h-4 text-blue-400" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-gray-900/95 text-white border-gray-800/50 backdrop-blur-sm">
                                                <p>View message status</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <span className="text-xs text-gray-400">{renderMessageStatus(message.status)}</span>
                                </div>
                            </div>
                            {message.replyTo && renderRepliedMessage(message.replyTo)}
                            {isARMessage ? (
                                isCurrentUserSender ? (
                                    <div className="space-y-2">
                                        <span className="text-purple-400 text-sm font-medium">AR Video Message Sent</span>
                                        <div className="flex items-center space-x-2 text-purple-400 text-sm">
                                            <MapPin className="w-4 h-4" />
                                            <span>{message.arMessage.latitude.toFixed(6)}, {message.arMessage.longitude.toFixed(6)}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2 text-purple-400 text-sm">
                                            <MapPin className="w-4 h-4" />
                                            <span>{message.arMessage.latitude.toFixed(6)}, {message.arMessage.longitude.toFixed(6)}</span>
                                        </div>
                                        <ARVideoHologram
                                            messageId={message.id}
                                            arMessage={message.arMessage}
                                            onVideoUpload={() => Promise.resolve()} // Not used for received messages
                                            onGestureVerified={(id) => {
                                                setMessages((prev) =>
                                                    prev.map((msg) =>
                                                        msg.id === id ? { ...msg, arMessage: { ...msg.arMessage!, isViewed: true } } : msg
                                                    )
                                                );
                                            }}
                                        />
                                        {message.arMessage.isViewed && message.file && (
                                            <span className="text-sm text-gray-400">AR Video Viewed</span>
                                        )}
                                    </div>
                                )
                            ) : (
                                <>
                                    {!message.isEncrypted && message.content && (
                                        message.isOneTimeView && !isRevealed ? (
                                            <div className="flex items-center space-x-2">
                                                <Eye className="w-4 h-4 text-gray-400" />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleReveal}
                                                    className="text-gray-400 hover:text-purple-400 transition-colors"
                                                >
                                                    Reveal One-Time Message
                                                </Button>
                                            </div>
                                        ) : (
                                            <p className="text-gray-100 text-sm leading-relaxed">{translatedMessages[message.id] || message.content}</p>
                                        )
                                    )}
                                    {message.file && !isARMessage && renderFileAttachment(message.file, preview, isRevealed)}
                                </>
                            )}
                            {(message.expiresAt || message.isOneTimeView) && (
                                <div className="flex items-center space-x-2 text-gray-400 text-xs">
                                    <Clock className="w-4 h-4" />
                                    <span>{message.isOneTimeView ? "One-time view" : formatExpirationTime(message.expiresAt)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-3 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {renderReactionButton(message)}
                        <div className="h-4 w-px bg-gray-700/50" />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplyingTo(message)}
                            className="text-gray-400 hover:text-purple-400 transition-colors"
                        >
                            <CornerUpRight className="w-4 h-4" />
                        </Button>
                        {!isARMessage && !message.isEncrypted && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        if (translatedMessages[message.id]) handleRevertTranslation(message.id);
                                        else {
                                            setSelectedLanguage("");
                                            setIsLanguageDialogOpen(true);
                                            setPendingTranslation(true);
                                            setCurrentTranslatingId(message.id);
                                        }
                                    }}
                                    className="text-gray-400 hover:text-purple-400 transition-colors"
                                >
                                    {translatedMessages[message.id] ? <RotateCcw className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSummarize(message.id)}
                                    className="text-gray-400 hover:text-purple-400 transition-colors"
                                >
                                    <FileText className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    };

    const handleStatusClick = (message: Message) => {
        setSelectedMessage(message)
        setIsStatusDialogOpen(true)
    }

    const renderMessageStatus = (status: MessageStatus) => {
        switch (status) {
            case MessageStatus.SENT:
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="5 0 40 60" width="20" height="30" className="text-gray-400">
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
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="5 0 40 60" width="20" height="30" className="text-blue-400">
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
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="5 0 40 60" width="20" height="30" className="text-green-400">
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
                (position) => setARLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    altitude: position.coords.altitude || 0,
                }),
                (error) => {
                    console.error("Error getting location:", error)
                    toast.error("Failed to get location")
                    setIsARMessage(false)
                }
            )
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            setFile(selectedFile)
            const url = URL.createObjectURL(selectedFile)
            setFilePreview({ fileIpfsHash: selectedFile.name, url })
        }
    }

    const downloadFile = async (fileIpfsHash: string, fileName: string) => {
        try {
            const response = await apiRequest(`/files/download/${fileIpfsHash}`, "GET", null, false, "blob")
            if (!response || !response.blob) throw new Error("Invalid response from server")

            const { blob, contentType } = response
            const url = window.URL.createObjectURL(new Blob([blob], { type: contentType }))
            const link = document.createElement("a")
            link.href = url
            link.download = fileName
            document.body.appendChild(link)
            link.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(link)
            toast.success("File downloaded!", { style: { background: "#1a1a1a", color: "#fff", border: "1px solid #333" } })
        } catch (error) {
            console.error("Error downloading file:", error)
            toast.error("Failed to download file")
        }
    }

    const previewFile = async (fileIpfsHash: string, fileName: string, fileType: string) => {
        try {
            const response = await apiRequest(`/files/download/${fileIpfsHash}`, "GET", null, false, "blob")
            if (!response || !response.blob) throw new Error("Invalid response from server")

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
        modal.style.backgroundColor = "rgba(0,0,0,0.9)"
        modal.style.display = "flex"
        modal.style.justifyContent = "center"
        modal.style.alignItems = "center"
        modal.style.zIndex = "1000"
        modal.style.backdropFilter = "blur(5px)"

        const closeButton = document.createElement("button")
        closeButton.innerHTML = "✕"
        closeButton.style.position = "absolute"
        closeButton.style.top = "20px"
        closeButton.style.right = "20px"
        closeButton.style.width = "40px"
        closeButton.style.height = "40px"
        closeButton.style.backgroundColor = "rgba(255, 255, 255, 0.1)"
        closeButton.style.color = "white"
        closeButton.style.border = "none"
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
            closeButton.style.backgroundColor = "rgba(255, 255, 255, 0.1)"
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

    const renderFileAttachment = (file: Message["file"], preview?: FilePreview, isRevealed?: boolean) => {
        if (!file) return null

        const isImage = file.fileType.startsWith("image/")
        const isVideo = file.fileType.startsWith("video/")
        const isPDF = file.fileType === "application/pdf"
        const isPreviewable = isImage || isVideo || isPDF

        return (
            <div className="mt-2 p-3 bg-gray-900/60 rounded-lg border border-gray-800/50 shadow-md hover:border-blue-500/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                        <Paperclip className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-blue-400 font-medium">{file.fileName}</span>
                        <span className="text-xs text-gray-400">({Math.round(file.fileSize / 1024)} KB)</span>
                    </div>
                    <div className="flex space-x-2">
                        {isPreviewable && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => previewFile(file.fileIpfsHash, file.fileName, file.fileType)}
                                className="hover:bg-gray-800/70 text-blue-400 transition-colors"
                            >
                                <Eye className="w-4 h-4 mr-1" />
                                <span>Preview</span>
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadFile(file.fileIpfsHash, file.fileName)}
                            className="hover:bg-gray-800/70 text-green-400 transition-colors"
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
                            className="rounded-lg object-cover max-w-[200px] max-h-[150px] shadow-sm"
                        />
                    </div>
                )}
            </div>
        )
    }

    const renderPreview = (preview: FilePreview | null, label: string, onRemove: () => void) => {
        if (!preview) return null

        const isImage = preview.url.includes("image") || preview.fileIpfsHash.includes(".png") || preview.fileIpfsHash.includes(".jpg")
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-gray-900/70 p-2 rounded-lg border border-gray-800/50 shadow-md hover:border-blue-500/50 transition-colors"
            >
                {isImage ? (
                    <img src={preview.url} alt={label} className="rounded-lg max-w-[100px] max-h-[80px] object-cover shadow-sm" />
                ) : (
                    <div className="flex items-center space-x-2">
                        <Paperclip className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-gray-300 font-medium">{label}</span>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 text-red-400 hover:text-red-500 p-1 bg-gray-900/80 rounded-full"
                    onClick={onRemove}
                >
                    <X className="w-4 h-4" />
                </Button>
            </motion.div>
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
                        "POST"
                    )
                    break
                case "changeTone":
                    response = await apiRequest(
                        `/messages/change-tone?text=${encodeURIComponent(newMessage)}&tone=${option}`,
                        "POST"
                    )
                    break
                case "changeFormat":
                    response = await apiRequest(
                        `/messages/change-format?text=${encodeURIComponent(newMessage)}&format=${option}`,
                        "POST"
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
            if (date.toDateString() === today.toDateString()) dateKey = "Today"
            else if (date.toDateString() === yesterday.toDateString()) dateKey = "Yesterday"
            else dateKey = date.toLocaleDateString()

            if (!groups[dateKey]) groups[dateKey] = []
            groups[dateKey].push(message)
        })
        return groups
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-slate-900 via-blue-900 to-purple-900">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="h-16 w-16 border-t-4 border-blue-500 rounded-full shadow-lg"
                />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-slate-900 via-blue-900 to-purple-900 text-white overflow-hidden">
            <PingIndicator />
            <div className="container mx-auto px-4 py-6 max-w-5xl h-screen flex flex-col">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center bg-gradient-to-r from-gray-900/90 to-black/90 p-3 rounded-full shadow-lg border border-gray-800/50 mb-4 backdrop-blur-lg"
                >
                    <Users className="w-5 h-5 text-purple-400 mr-2" />
                    <span className="text-sm font-semibold text-gray-200">
                        {currentUser} connected to {connectedUser}
                    </span>
                </motion.div>
                <Card className="flex-grow overflow-hidden border-0 bg-black/40 backdrop-blur-2xl shadow-2xl rounded-2xl">
                    {chatExpiration && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-purple-600/20 text-purple-200 p-2 text-center text-xs font-medium rounded-t-2xl border-b border-purple-600/30 shadow-sm"
                        >
                            <Clock className="w-4 h-4 inline-block mr-2" />
                            Messages disappear after {formatChatExpiration(chatExpiration)}
                        </motion.div>
                    )}
                    <CardContent className="p-6 h-full flex flex-col">
                        {messages.length === 0 ? (
                            <div className="flex-grow flex items-center justify-center">
                                <span className="text-gray-400 text-lg font-medium">Start Chatting</span>
                            </div>
                        ) : (
                            <ScrollArea className="flex-grow pr-4 mb-4 rounded-lg" ref={scrollAreaRef}>
                                <AnimatePresence mode="popLayout" initial={false}>
                                    {Object.entries(groupMessagesByDate([...messages].reverse())).map(([date, msgs]) => (
                                        <div key={date}>
                                            <div className="sticky top-0 flex items-center justify-center py-2 z-10">
                                                <div className="bg-gray-900/90 px-4 py-1 rounded-full text-xs text-gray-400 font-medium shadow-md border border-gray-800/50">
                                                    {date}
                                                </div>
                                            </div>
                                            <div className="space-y-4">{msgs.map(renderMessage)}</div>
                                        </div>
                                    ))}
                                </AnimatePresence>
                                <div ref={messagesEndRef} />
                            </ScrollArea>
                        )}

                        {showScrollButton && messages.length > 0 && (
                            <Button
                                onClick={handleScrollToBottom}
                                className="fixed bottom-24 right-8 rounded-full p-3 bg-gradient-to-r from-blue-6 via-blue-900 to-purple-900 text-white overflow-hidden00 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-blue-600/40"
                            >
                                <ChevronDown className="w-5 h-5" />
                            </Button>
                        )}

                        <form onSubmit={sendMessage} className="space-y-4 mt-4 relative">
                            {aiFeatureActive && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl z-10"
                                >
                                    <div className="flex items-center space-x-2 text-white">
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                                        <span>Processing {aiFeatureActive}...</span>
                                    </div>
                                </motion.div>
                            )}
                            {replyingTo && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-gray-900/70 rounded-lg p-3 flex items-center justify-between border border-gray-800/50 shadow-sm"
                                >
                                    <span className="text-sm text-purple-400 font-medium">Replying to {replyingTo.sender?.username}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setReplyingTo(null)}
                                        className="text-gray-400 hover:text-purple-400 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </motion.div>
                            )}

                            {(filePreview || generatedImagePreview) && (
                                <div className="flex gap-2 flex-wrap">
                                    {renderPreview(filePreview, file?.name || "Attached File", () => {
                                        setFile(null)
                                        setFilePreview(null)
                                    })}
                                    {renderPreview(generatedImagePreview, "Generated Image", () => setGeneratedImagePreview(null))}
                                </div>
                            )}

                            <div className="flex gap-3 items-end">
                                <div className="flex-1 relative group">
                                    <Textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="bg-gradient-to-br from-gray-900/80 to-black/80 border-2 border-gray-800/50 hover:border-blue-500/60 focus:border-purple-500/70 text-gray-100 resize-none min-h-[100px] rounded-xl transition-all duration-300 placeholder:text-gray-500 shadow-inner focus:ring-2 focus:ring-purple-500/30"
                                        maxLength={1000}
                                        disabled={aiFeatureActive !== null}
                                    />
                                    <div className="absolute right-3 bottom-3 px-2 py-1 text-xs text-gray-400 bg-gray-900/60 rounded-md backdrop-blur-sm shadow-sm">
                                        {newMessage.length}/1000
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Button
                                        type="submit"
                                        disabled={sending || aiFeatureActive !== null}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 h-12 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg hover:shadow-blue-600/40"
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
                                    <Button
                                        onClick={() => {
                                            setIsARVideoDialogOpen(true)
                                            navigator.geolocation.getCurrentPosition(
                                                (position) => setARLocation({
                                                    latitude: position.coords.latitude,
                                                    longitude: position.coords.longitude,
                                                    altitude: position.coords.altitude || 0,
                                                }),
                                                (error) => {
                                                    console.error("Error getting location:", error)
                                                    toast.error("Failed to get location")
                                                }
                                            )
                                        }}
                                        variant="outline"
                                        disabled={sending}
                                        className="bg-gradient-to-r from-gray-900/80 to-black/80 border-gray-800/50 text-gray-100 hover:bg-gray-800/90 hover:border-blue-500/60 transition-all duration-300 shadow-md rounded-xl"
                                    >
                                        <Video className="w-4 h-4 mr-2" />
                                        Send AR Hologram
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="bg-gradient-to-r from-gray-900/80 to-black/80 border-gray-800/50 text-gray-100 hover:bg-gray-800/90 hover:border-blue-500/60 transition-all duration-300 shadow-md rounded-full"
                                            disabled={aiFeatureActive !== null}
                                        >
                                            <Sparkles className="w-4 h-4 mr-2 text-blue-400" />
                                            Actions
                                            <ChevronDown className="w-4 h-4 ml-2" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56 bg-gray-900/95 border border-gray-800/50 backdrop-blur-lg shadow-lg rounded-xl">
                                        <div className="grid gap-2">
                                            <Button
                                                onClick={toggleARMessage}
                                                variant={isARMessage ? "secondary" : "ghost"}
                                                disabled={sending}
                                                className="justify-start text-white hover:bg-gray-800/70 transition-colors rounded-lg"
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
                                                    className={`justify-start text-white hover:bg-gray-800/70 transition-colors rounded-lg ${aiFeatureActive === feature.name ? "bg-blue-600/80" : ""}`}
                                                >
                                                    {feature.icon}
                                                    <span className="ml-2">{feature.name}</span>
                                                </Button>
                                            ))}
                                            <Button
                                                onClick={() => fileInputRef.current?.click()}
                                                variant="ghost"
                                                disabled={sending}
                                                className="justify-start text-white hover:bg-gray-800/70 transition-colors rounded-lg"
                                            >
                                                <Paperclip className="w-4 h-4 mr-2" />
                                                Attach File
                                            </Button>
                                            <Select
                                                value={expirationOption}
                                                onValueChange={(value) => {
                                                    setExpirationOption(value)
                                                    setIsOneTimeView(false)
                                                }}
                                            >
                                                <SelectTrigger className="bg-gray-900/80 border-gray-800/50 text-white rounded-lg">
                                                    <SelectValue placeholder="Disappearing Message" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-gray-900 text-white border-gray-800/50 rounded-lg">
                                                    <SelectItem value="off">Off</SelectItem>
                                                    <SelectItem value="5-minutes">5 Minutes</SelectItem>
                                                    <SelectItem value="30-minutes">30 Minutes</SelectItem>
                                                    <SelectItem value="1-hours">1 Hour</SelectItem>
                                                    <SelectItem value="6-hours">6 Hours</SelectItem>
                                                    <SelectItem value="1-days">1 Day</SelectItem>
                                                    <SelectItem value="7-days">7 Days</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                onClick={() => {
                                                    setIsOneTimeView(!isOneTimeView)
                                                    setExpirationOption("off")
                                                }}
                                                variant={isOneTimeView ? "secondary" : "ghost"}
                                                className="justify-start text-white hover:bg-gray-800/70 transition-colors rounded-lg"
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                {isOneTimeView ? "Cancel One-Time View" : "One-Time View"}
                                            </Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                                {isARMessage && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center space-x-2 bg-gray-900/70 rounded-full px-3 py-1 shadow-md border border-gray-800/50"
                                    >
                                        <MapPin className="w-4 h-4 text-purple-400" />
                                        <span className="text-sm text-gray-300 font-medium">
                                            {arLocation.latitude.toFixed(6)}, {arLocation.longitude.toFixed(6)}
                                        </span>
                                    </motion.div>
                                )}
                                {(expirationOption !== "off" || isOneTimeView) && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center space-x-2 bg-gray-900/70 rounded-full px-3 py-1 shadow-md border border-gray-800/50"
                                    >
                                        <Clock className="w-4 h-4 text-purple-400" />
                                        <span className="text-sm text-gray-300 font-medium">
                                            {isOneTimeView ? "One-Time View" : expirationOption.replace("-", " ")}
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
                <DialogContent className="bg-gray-900/95 border border-gray-800/50 backdrop-blur-lg text-white shadow-xl rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-purple-300">Select Language for Translation</DialogTitle>
                    </DialogHeader>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                        <SelectTrigger className="bg-gray-900/80 border-gray-800/50 text-white rounded-lg">
                            <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-800/50 text-white rounded-lg">
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
                            className="bg-gray-900/80 border-gray-800/50 hover:bg-gray-800/90 text-white rounded-lg"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (selectedLanguage) {
                                    if (currentTranslatingId) {
                                        const messageToTranslate = messages.find((m) => m.id === currentTranslatingId)
                                        if (messageToTranslate) handleTranslation(messageToTranslate.content, currentTranslatingId)
                                    } else if (newMessage.trim()) {
                                        handleTranslation(newMessage)
                                    } else {
                                        toast.error("Please enter some text to translate")
                                        return
                                    }
                                }
                                setIsLanguageDialogOpen(false)
                                if (!currentTranslatingId) setSelectedLanguage("")
                                setCurrentTranslatingId(null)
                            }}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg"
                        >
                            Translate
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
                <DialogContent className="bg-gray-900/95 border border-gray-800/50 backdrop-blur-lg text-white shadow-xl rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-purple-300">Message Status</DialogTitle>
                    </DialogHeader>
                    {selectedMessage && (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -8 20 16" width="20" height="16" className="text-gray-400">
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
                                <p className="text-sm"><strong>Sent at:</strong> {new Date(selectedMessage.sentAt).toLocaleString()}</p>
                            </div>
                            {selectedMessage.deliveredAt && (
                                <div className="flex items-center space-x-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -10 20 20" width="20" height="20" className="text-blue-400">
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
                                    <p className="text-sm"><strong>Delivered at:</strong> {new Date(selectedMessage.deliveredAt).toLocaleString()}</p>
                                </div>
                            )}
                            {selectedMessage.seenAt && (
                                <div className="flex items-center space-x-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -15 20 30" width="20" height="30" className="text-green-400">
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
                                    <p className="text-sm"><strong>Seen at:</strong> {new Date(selectedMessage.seenAt).toLocaleString()}</p>
                                </div>
                            )}
                            {selectedMessage.expiresAt && (
                                <div className="flex items-center space-x-2">
                                    <Clock className="w-5 h-5 text-gray-400" />
                                    <p className="text-sm"><strong>Expires at:</strong> {new Date(selectedMessage.expiresAt).toLocaleString()}</p>
                                </div>
                            )}
                            {selectedMessage.isOneTimeView && (
                                <div className="flex items-center space-x-2">
                                    <Eye className="w-5 h-5 text-gray-400" />
                                    <p className="text-sm"><strong>One-Time View:</strong> Yes</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isARVideoDialogOpen} onOpenChange={setIsARVideoDialogOpen}>
                <DialogContent className="bg-gray-900/95 border border-gray-800/50 backdrop-blur-lg text-white shadow-xl rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-purple-300">Record AR Video Hologram</DialogTitle>
                    </DialogHeader>
                    <ARVideoHologram
                        onVideoUpload={async (videoBlob: Blob, gestureTrigger: string) => {
                            setRecordedARVideo({ blob: videoBlob, gestureTrigger })
                            await sendMessage(new Event("submit") as any); // Trigger sendMessage
                        }}
                    />
                    {recordedARVideo && (
                        <Button
                            onClick={sendMessage}
                            className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg"
                        >
                            Send AR Video
                        </Button>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
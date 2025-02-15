"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"
import { apiRequest } from "@/utils/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, Trash2, Users, ArrowLeft } from "lucide-react"

interface Chat {
    id: number
    name: string
    isGroupChat: boolean
    lastMessage?: string
    createdAt: string
}

export default function ManageChats() {
    const [chats, setChats] = useState<Chat[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const data = await apiRequest("/chats", "GET")
                setChats(data)
                setLoading(false)
            } catch (error) {
                console.error("Error fetching chats:", error)
                toast.error("Failed to fetch chats. Please try again.")
                setLoading(false)
            }
        }

        fetchChats()
    }, [])

    const handleDeleteChat = async (chatId: number) => {
        try {
            const response = await apiRequest(`/chats/${chatId}`, "DELETE");
            if (response.success) {
                setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
                toast.success("Chat deleted successfully");
            } else {
                throw new Error(response.message || "Failed to delete chat");
            }
        } catch (error) {
            console.error("Error deleting chat:", error);
            toast.error(error instanceof Error ? error.message : "Failed to delete chat. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <Skeleton className="h-8 w-48" />
                    </div>
                    <Card className="bg-gray-800 border-gray-700">
                        <CardHeader>
                            <Skeleton className="h-8 w-48 mb-4" />
                            <Skeleton className="h-4 w-72" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="h-12 w-12 rounded-full" />
                                            <Skeleton className="h-4 w-48" />
                                        </div>
                                        <Skeleton className="h-10 w-24" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8"
        >
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push("/dashboard")}
                            className="rounded-full hover:bg-gray-700"
                        >
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                            Manage Eternallinks
                        </h1>
                    </div>
                    <Badge variant="secondary" className="px-4 py-2 text-lg rounded-full">
                        {chats.length} Chats
                    </Badge>
                </div>

                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-6 w-6 text-blue-400" />
                            <CardTitle className="text-2xl text-white">Your Chats</CardTitle>
                        </div>
                        <CardDescription>View and manage your connected chats</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AnimatePresence mode="popLayout">
                            {chats.length > 0 ? (
                                <motion.ul className="space-y-4" layout>
                                    {chats.map((chat) => (
                                        <motion.li
                                            key={chat.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -100 }}
                                            transition={{ duration: 0.2 }}
                                            className="group flex items-center justify-between p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg border border-gray-600 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-12 w-12 border-2 border-blue-500">
                                                    <AvatarImage src={`/placeholder-chat-${chat.id}.jpg`} />
                                                    <AvatarFallback className="bg-blue-500">{chat.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="space-y-1">
                                                    <p className="text-lg font-medium">{chat.name}</p>
                                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                                        {chat.isGroupChat ? <Users className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                                                        <span>
                              {chat.isGroupChat ? "Group Chat" : "Direct Message"} • Created{" "}
                                                            {new Date(chat.createdAt).toLocaleDateString()}
                            </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Button
                                                    onClick={() => handleDeleteChat(chat.id)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="rounded-full hover:bg-red-500/20 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </motion.li>
                                    ))}
                                </motion.ul>
                            ) : (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
                                    <div className="flex justify-center mb-4">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
                                            <div className="relative bg-gray-700 p-4 rounded-full">
                                                <MessageSquare className="h-8 w-8 text-blue-400" />
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">No Chats Yet</h3>
                                    <p className="text-gray-400">Start a new conversation to see your chats here</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    )
}


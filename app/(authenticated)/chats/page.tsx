"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import toast from "react-hot-toast"
import { apiRequest } from "@/utils/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, Users, Plus, Search } from "lucide-react"

interface Chat {
    id: number
    name: string
    isGroupChat: boolean
    lastMessage?: string
    lastMessageTime?: string
}

export default function Chats() {
    const [chats, setChats] = useState<Chat[]>([])
    const [newChatEternalLink, setNewChatEternalLink] = useState("")
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchChats()
    }, [])

    const fetchChats = async () => {
        setLoading(true)
        try {
            const response = await apiRequest("/chats", "GET")
            setChats(response)
        } catch (error) {
            console.error("Error fetching chats:", error)
            toast.error("Failed to fetch chats")
        } finally {
            setLoading(false)
        }
    }

    const sendChatRequest = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await apiRequest("/chats/request", "POST", { receiverEternalLink: newChatEternalLink })
            toast.success("Chat request sent successfully!")
            setNewChatEternalLink("")
        } catch (error) {
            console.error("Error:", error)
            toast.error("Failed to send chat request")
        }
    }

    const filteredChats = chats.filter((chat) => chat.name.toLowerCase().includes(searchTerm.toLowerCase()))

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8"
        >
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                    Your Chats
                </h1>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Card className="bg-gray-800 border-gray-700 mb-6">
                            <CardHeader>
                                <CardTitle className="text-2xl text-white">Chat List</CardTitle>
                                <CardDescription>Browse and manage your conversations</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search chats..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 bg-gray-700 border-gray-600 text-white"
                                    />
                                </div>
                                {loading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center space-x-4">
                                                <Skeleton className="h-12 w-12 rounded-full" />
                                                <div className="space-y-2 flex-1">
                                                    <Skeleton className="h-4 w-1/4" />
                                                    <Skeleton className="h-4 w-3/4" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <AnimatePresence>
                                        {filteredChats.length > 0 ? (
                                            <motion.div layout className="space-y-4">
                                                {filteredChats.map((chat) => (
                                                    <motion.div
                                                        key={chat.id}
                                                        layout
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                    >
                                                        <Link href={`/chats/${chat.id}`}>
                                                            <Card className="bg-gray-700 hover:bg-gray-600 transition duration-300 cursor-pointer">
                                                                <CardContent className="p-4 flex items-center space-x-4">
                                                                    <Avatar className="h-12 w-12">
                                                                        <AvatarImage src={`/placeholder-avatar-${chat.id}.jpg`} />
                                                                        <AvatarFallback>{chat.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center justify-between">
                                                                            <h2 className="text-lg font-semibold text-white truncate">{chat.name}</h2>
                                                                            <Badge variant={chat.isGroupChat ? "secondary" : "outline"}>
                                                                                {chat.isGroupChat ? (
                                                                                    <Users className="h-3 w-3 mr-1" />
                                                                                ) : (
                                                                                    <MessageSquare className="h-3 w-3 mr-1" />
                                                                                )}
                                                                                {chat.isGroupChat ? "Group" : "Private"}
                                                                            </Badge>
                                                                        </div>
                                                                        {chat.lastMessage && (
                                                                            <p className="text-sm text-gray-400 truncate mt-1">{chat.lastMessage}</p>
                                                                        )}
                                                                        {chat.lastMessageTime && (
                                                                            <p className="text-xs text-gray-500 mt-1">{chat.lastMessageTime}</p>
                                                                        )}
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        </Link>
                                                    </motion.div>
                                                ))}
                                            </motion.div>
                                        ) : (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                                                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                                <h3 className="text-xl font-semibold text-white mb-2">No chats found</h3>
                                                <p className="text-gray-400">
                                                    {searchTerm ? "Try a different search term" : "Start a new conversation to get chatting!"}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                    <div>
                        <Card className="bg-gray-800 border-gray-700 sticky top-8">
                            <CardHeader>
                                <CardTitle className="text-2xl text-white flex items-center">
                                    <Plus className="h-6 w-6 mr-2 text-purple-400" />
                                    Start a New Chat
                                </CardTitle>
                                <CardDescription>Enter an EternalLink to send a chat request</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={sendChatRequest} className="space-y-4">
                                    <Input
                                        type="text"
                                        value={newChatEternalLink}
                                        onChange={(e) => setNewChatEternalLink(e.target.value)}
                                        placeholder="Enter EternalLink"
                                        className="bg-gray-700 border-gray-600 text-white"
                                    />
                                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                                        Send Request
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}


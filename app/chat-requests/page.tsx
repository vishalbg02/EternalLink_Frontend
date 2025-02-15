"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/utils/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Bell, Check, X, Users, Clock, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface ChatRequest {
    id: number
    senderUsername: string
}

export default function ChatRequests() {
    const [chatRequests, setChatRequests] = useState<ChatRequest[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const fetchChatRequests = async () => {
            try {
                const data = await apiRequest("/chats/requests", "GET")
                setChatRequests(data)
                setLoading(false)
            } catch (error) {
                console.error("Error fetching chat requests:", error)
                toast.error("Failed to fetch chat requests. Please try again.")
                setLoading(false)
            }
        }

        fetchChatRequests()
    }, [])

    const handleApproveRequest = async (requestId: number) => {
        try {
            await apiRequest(`/chats/approve/${requestId}`, "POST")
            setChatRequests((prevRequests) => prevRequests.filter((request) => request.id !== requestId))
            toast.success("Chat request approved!")
        } catch (error) {
            console.error("Error approving chat request:", error)
            toast.error("Failed to approve chat request. Please try again.")
        }
    }

    const handleRejectRequest = async (requestId: number) => {
        try {
            await apiRequest(`/chats/reject/${requestId}`, "POST")
            setChatRequests((prevRequests) => prevRequests.filter((request) => request.id !== requestId))
            toast.success("Chat request rejected")
        } catch (error) {
            console.error("Error rejecting chat request:", error)
            toast.error("Failed to reject chat request. Please try again.")
        }
    }

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
                                        <div className="flex gap-2">
                                            <Skeleton className="h-10 w-24" />
                                            <Skeleton className="h-10 w-24" />
                                        </div>
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
                            onClick={() => router.back()}
                            className="rounded-full hover:bg-gray-700"
                        >
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                            Chat Requests
                        </h1>
                    </div>
                    <Badge variant="secondary" className="px-4 py-2 text-lg rounded-full">
                        {chatRequests.length} Pending
                    </Badge>
                </div>

                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="h-6 w-6 text-purple-400" />
                            <CardTitle className="text-2xl text-white">Pending Requests</CardTitle>
                        </div>
                        <CardDescription>Review and manage your incoming chat requests</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AnimatePresence mode="popLayout">
                            {chatRequests.length > 0 ? (
                                <motion.ul className="space-y-4" layout>
                                    {chatRequests.map((request) => (
                                        <motion.li
                                            key={request.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -100 }}
                                            transition={{ duration: 0.2 }}
                                            className="group flex items-center justify-between p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg border border-gray-600 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-12 w-12 border-2 border-purple-500">
                                                    <AvatarImage src={`/placeholder-user-${request.id}.jpg`} />
                                                    <AvatarFallback className="bg-purple-500">
                                                        {request.senderUsername.slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="space-y-1">
                                                    <p className="text-lg font-medium">{request.senderUsername}</p>
                                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                                        <Clock className="h-4 w-4" />
                                                        <span>Pending approval</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Button
                                                    onClick={() => handleRejectRequest(request.id)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="rounded-full hover:bg-red-500/20 hover:text-red-500 transition-colors"
                                                >
                                                    <X className="h-5 w-5" />
                                                </Button>
                                                <Button
                                                    onClick={() => handleApproveRequest(request.id)}
                                                    size="icon"
                                                    className="rounded-full bg-green-500 hover:bg-green-600"
                                                >
                                                    <Check className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </motion.li>
                                    ))}
                                </motion.ul>
                            ) : (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
                                    <div className="flex justify-center mb-4">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping" />
                                            <div className="relative bg-gray-700 p-4 rounded-full">
                                                <Users className="h-8 w-8 text-purple-400" />
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">No Pending Requests</h3>
                                    <p className="text-gray-400">When someone wants to chat, their request will appear here</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    )
}


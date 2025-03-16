"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"
import { apiRequest } from "@/utils/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { User, Loader2, Plus } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface UserPreview {
    username: string
    found: boolean
}

export default function Chats() {
    const [newChatEternalLink, setNewChatEternalLink] = useState("")
    const [userPreview, setUserPreview] = useState<UserPreview | null>(null)
    const [fetchingUser, setFetchingUser] = useState(false)
    const [requestSending, setRequestSending] = useState(false)
    const [recentRequests, setRecentRequests] = useState<string[]>([])

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (newChatEternalLink.trim().length > 0) {
                fetchUserByEternalLink(newChatEternalLink)
            } else {
                setUserPreview(null)
            }
        }, 300)

        return () => clearTimeout(debounceTimer)
    }, [newChatEternalLink])

    const fetchUserByEternalLink = async (eternalLink: string) => {
        setFetchingUser(true)
        try {
            const response = await apiRequest(`/chats/users/by-eternal-link/${eternalLink}`, "GET")
            setUserPreview({
                username: response.username,
                found: true
            })
        } catch (error) {
            console.error("Error fetching user:", error)
            setUserPreview({
                username: "",
                found: false
            })
        } finally {
            setFetchingUser(false)
        }
    }

    const sendChatRequest = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userPreview?.found) {
            toast.error("Please enter a valid EternalLink")
            return
        }

        setRequestSending(true)
        try {
            await apiRequest("/chats/request", "POST", { receiverEternalLink: newChatEternalLink })
            toast.success(`Chat request sent to ${userPreview.username}!`)
            setRecentRequests(prev => [userPreview.username, ...prev.slice(0, 4)])
            setNewChatEternalLink("")
            setUserPreview(null)
        } catch (error) {
            console.error("Error:", error)
            toast.error("Failed to send chat request")
        } finally {
            setRequestSending(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8"
        >
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col items-center justify-center py-10 md:py-16">
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="text-4xl md:text-5xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"
                    >
                        Connect with Others
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="text-gray-300 text-center max-w-2xl mb-12"
                    >
                        Enter an EternalLink to start a new conversation with friends or colleagues.
                    </motion.p>

                    <div className="w-full max-w-xl mx-auto">
                        <Card className="bg-gray-800/80 border-gray-700 backdrop-blur-sm shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-2xl text-white flex items-center">
                                    <Plus className="h-6 w-6 mr-2 text-purple-400" />
                                    Start a New Chat
                                </CardTitle>
                                <CardDescription className="text-gray-300">
                                    Enter an EternalLink to send a chat request
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={sendChatRequest} className="space-y-5">
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Input
                                                type="text"
                                                value={newChatEternalLink}
                                                onChange={(e) => setNewChatEternalLink(e.target.value)}
                                                placeholder="Enter EternalLink"
                                                className="bg-gray-700/80 border-gray-600 text-white pr-10 h-12 text-lg"
                                                disabled={fetchingUser || requestSending}
                                            />
                                            {fetchingUser && (
                                                <Loader2 className="w-5 h-5 animate-spin absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            )}
                                        </div>

                                        <AnimatePresence>
                                            {userPreview && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="overflow-hidden"
                                                >
                                                    {userPreview.found ? (
                                                        <div className="flex items-center p-3 rounded-md bg-gray-700/80">
                                                            <div className="bg-green-500/20 p-2 rounded-full mr-3">
                                                                <User className="h-5 w-5 text-green-400" />
                                                            </div>
                                                            <span className="text-white">User found: <span className="font-medium text-green-400">{userPreview.username}</span></span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center p-3 rounded-md bg-gray-700/80">
                                                            <div className="bg-red-500/20 p-2 rounded-full mr-3">
                                                                <User className="h-5 w-5 text-red-400" />
                                                            </div>
                                                            <span className="text-white">No user found with this EternalLink</span>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div>
                                                    <Button
                                                        type="submit"
                                                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12 text-lg font-medium rounded-md transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
                                                        disabled={fetchingUser || requestSending || !userPreview?.found}
                                                    >
                                                        {requestSending ? (
                                                            <>
                                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                                Sending...
                                                            </>
                                                        ) : (
                                                            "Send Chat Request"
                                                        )}
                                                    </Button>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent
                                                className="bg-gray-900 text-white border-gray-700"
                                                hidden={!(!userPreview?.found && newChatEternalLink.length > 0)}
                                            >
                                                Please enter a valid EternalLink
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </form>

                                {recentRequests.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="mt-6 pt-6 border-t border-gray-700/50"
                                    >
                                        <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Requests</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {recentRequests.map((username, index) => (
                                                <span key={index} className="px-3 py-1 bg-gray-700/50 rounded-full text-sm text-gray-300">
                                                    {username}
                                                </span>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </CardContent>
                        </Card>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6, duration: 1 }}
                            className="mt-8 text-center text-gray-400 text-sm"
                        >
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
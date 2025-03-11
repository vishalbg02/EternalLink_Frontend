"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { apiRequest } from "@/utils/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import ChatbotWidget from "@/components/ChatbotWidget"
import {
    MessageSquare,
    Users,
    MapPin,
    User,
    Bell,
    LinkIcon,
    Calendar,
    Settings,
    LogOut
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem
} from "@/components/ui/dropdown-menu"

// Utility function to handle IPFS URLs
const getIpfsUrl = (hash: string | null): string => {
    if (!hash) return "/placeholder-avatar.jpg";
    // Check if it's already a URL
    if (hash.startsWith('http')) return hash;
    // Use IPFS gateway
    const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs/";
    // Remove 'ipfs://' prefix if present
    const cleanHash = hash.startsWith('ipfs://') ? hash.slice(7) : hash;
    return `${IPFS_GATEWAY}${cleanHash}`;
}

interface UserData {
    success: boolean
    message: string
    data?: {
        id: number
        username: string
        email: string
        createdAt: string
        lastLogin: string
        eternalLink: string | null
        bio: string | null
        status: string | null
        profilePhotoUrl: string | null
    }
}

interface Chat {
    id: number
    name: string
    isGroupChat: boolean
    lastMessage?: string
}

interface ChatRequest {
    id: number
    senderUsername: string
}

export default function Dashboard() {
    const [user, setUser] = useState<UserData | null>(null)
    const [chats, setChats] = useState<Chat[]>([])
    const [chatRequests, setChatRequests] = useState<ChatRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    // Add cache busting for profile photo
    const getProfilePhotoUrl = (url: string | null) => {
        const baseUrl = getIpfsUrl(url);
        if (baseUrl === "/placeholder-avatar.jpg") return baseUrl;

        // Add timestamp to bust cache
        const timestamp = new Date().getTime();
        const separator = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${separator}t=${timestamp}`;
    }

    const handleSignOut = async () => {
        try {
            await apiRequest("/auth/signout", "POST")
            localStorage.removeItem("token")
            router.push("/login")
            toast.success("Signed out successfully")
        } catch (error) {
            console.error("Error signing out:", error)
            toast.error("Failed to sign out")
        }
    }


    useEffect(() => {
        const fetchUserAndChats = async () => {
            try {
                setError(null)
                const [userData, chatsData, chatRequestsData] = await Promise.all([
                    apiRequest("/users/me"),
                    apiRequest("/chats"),
                    apiRequest("/chats/requests"),
                ])
                setUser(userData)
                setChats(chatsData)
                setChatRequests(chatRequestsData)
                setLoading(false)
            } catch (error) {
                console.error("Error fetching data:", error)
                setError("Failed to fetch user data. Please try logging in again.")
                toast.error("Failed to fetch user data. Please try logging in again.")
                setLoading(false)
                router.push("/login")
            }
        }

        fetchUserAndChats()
    }, [router])

    const handleApproveRequest = async (requestId: number) => {
        try {
            const response = await apiRequest(`/chats/approve/${requestId}`, "POST")
            setChatRequests((prevRequests) => prevRequests.filter((request) => request.id !== requestId))
            toast.success("Chat request approved!")

            // Add the new chat to the chats list
            if (response.id) {
                setChats((prevChats) => [...prevChats, response])
            }
        } catch (error) {
            console.error("Error approving chat request:", error)
            toast.error("Failed to approve chat request. Please try again.")
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-900">
                <div
                    className="text-2xl font-bold text-white"
                >
                    Loading...
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-900">
                <div
                    className="text-2xl font-bold text-red-500"
                >
                    {error}
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-900">
                <div
                    className="text-2xl font-bold text-red-500"
                >
                    Error loading user data. Please try again.
                </div>
            </div>
        )
    }

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8"
        >
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                        Welcome, {user.data?.username}!
                    </h1>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Settings className="mr-2 h-4 w-4" /> Settings
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
                            <DropdownMenuItem onClick={() => router.push("/change_password")}>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Change Password</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push("/delete-account")}>
                                <User className="mr-2 h-4 w-4" />
                                <span>Delete Account</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleSignOut}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Sign Out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="bg-gray-800 border-gray-700 col-span-1">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold text-white">Your Profile</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-4 mb-6">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage
                                        src={getProfilePhotoUrl(user.data?.profilePhotoUrl)}
                                        alt={user.data?.username}
                                    />
                                    <AvatarFallback>{user.data?.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-2xl font-bold">{user.data?.username}</h2>
                                    <p className="text-gray-400">{user.data?.email}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <LinkIcon className="mr-2 h-5 w-5 text-blue-400" />
                                    <span className="font-medium">Eternal Link:</span>
                                    <span className="ml-2 text-gray-300">{user.data?.eternalLink || "Not available"}</span>
                                </div>
                                <div className="flex items-center">
                                    <Calendar className="mr-2 h-5 w-5 text-green-400" />
                                    <span className="font-medium">Member since:</span>
                                    <span className="ml-2 text-gray-300">
                                        {new Date(user.data?.createdAt || "").toLocaleDateString()}
                                    </span>
                                </div>
                                {user.data?.bio && (
                                    <div className="mt-2">
                                        <h3 className="text-sm font-medium text-gray-300">Bio</h3>
                                        <p className="text-gray-400 mt-1">{user.data.bio}</p>
                                    </div>
                                )}
                                {user.data?.status && (
                                    <div className="flex items-center">
                                        <span className="font-medium">Status:</span>
                                        <span className="ml-2 text-gray-300">{user.data.status}</span>
                                    </div>
                                )}
                            </div>
                            <Button
                                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => router.push("/profile-edit")}
                            >
                                <User className="mr-2 h-4 w-4" /> Edit Profile
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700 col-span-2">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold text-white">Your Chats</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {chats.length > 0 ? (
                                <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                    {chats.map((chat) => (
                                        <li key={chat.id}>
                                            <Link
                                                href={`/chats/${chat.id}`}
                                                className="flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                            >
                                                <div className="flex items-center min-w-0 flex-1">
                                                    <Avatar className="h-10 w-10 shrink-0 mr-3">
                                                        <AvatarImage src={`/placeholder-chat-${chat.id}.jpg`} alt={chat.name} />
                                                        <AvatarFallback>{chat.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0 flex-1">
                                                        <span className="font-medium block truncate">{chat.name}</span>
                                                        {chat.lastMessage && <p className="text-sm text-gray-400 truncate">{chat.lastMessage}</p>}
                                                    </div>
                                                </div>
                                                <div className="ml-4 shrink-0">
                                                    {chat.isGroupChat ? (
                                                        <Badge variant="secondary">
                                                            <Users className="h-4 w-4 mr-1" /> Group
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline">
                                                            <MessageSquare className="h-4 w-4 mr-1" /> Direct
                                                        </Badge>
                                                    )}
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-8">
                                    <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                                    <p className="text-gray-400">No chats yet. Start a new conversation!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    <Card className="bg-gray-800 border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold text-white">Chat Requests</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {chatRequests.length > 0 ? (
                                <ul className="space-y-3">
                                    {chatRequests.map((request) => (
                                        <li key={request.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                                            <div className="flex items-center">
                                                <Avatar className="h-10 w-10 mr-3">
                                                    <AvatarImage src={`/placeholder-user-${request.id}.jpg`} alt={request.senderUsername} />
                                                    <AvatarFallback>{request.senderUsername.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{request.senderUsername} wants to chat</span>
                                            </div>
                                            <Button
                                                onClick={() => handleApproveRequest(request.id)}
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                Approve
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-8">
                                    <Bell className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                                    <p className="text-gray-400">No pending chat requests</p>
                                </div>
                            )}
                            <Button
                                className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={() => router.push("/chat-requests")}
                            >
                                <Bell className="mr-2 h-4 w-4" /> View All Chat Requests
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold text-white">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    onClick={() => router.push("/ar-messages")}
                                    className="bg-blue-600 hover:bg-blue-700 text-white h-24 flex flex-col items-center justify-center"
                                >
                                    <MapPin className="h-8 w-8 mb-2" />
                                    <span>Explore AR Messages</span>
                                </Button>
                                <Button
                                    onClick={() => router.push("/contacts")}
                                    className="bg-purple-600 hover:bg-purple-700 text-white h-24 flex flex-col items-center justify-center"
                                >
                                    <Users className="h-8 w-8 mb-2" />
                                    <span>Manage Contacts</span>
                                </Button>
                                <Button
                                    onClick={() => router.push("/chats")}
                                    className="bg-green-600 hover:bg-green-700 text-white h-24 flex flex-col items-center justify-center"
                                >
                                    <MessageSquare className="h-8 w-8 mb-2" />
                                    <span>Create New Chat</span>
                                </Button>
                                <Button
                                    onClick={() => router.push("/eternal-links")}
                                    className="bg-yellow-600 hover:bg-yellow-700 text-white h-24 flex flex-col items-center justify-center"
                                >
                                    <LinkIcon className="h-8 w-8 mb-2" />
                                    <span>Manage Eternal Link</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ChatbotWidget />

        </div>
    )
}
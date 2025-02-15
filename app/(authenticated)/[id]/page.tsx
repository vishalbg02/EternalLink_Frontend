'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { apiRequest } from '@/utils/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Send } from 'lucide-react'

interface Message {
    id: number
    content: string
    sender: {
        username: string
    }
    sentAt: string
    arMessage?: {
        latitude: number
        longitude: number
        altitude: number
        expiresAt: string
    }
}

export default function Chat() {
    const { id } = useParams()
    const router = useRouter()
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isARMessage, setIsARMessage] = useState(false)
    const [arLocation, setARLocation] = useState({ latitude: 0, longitude: 0, altitude: 0 })
    const [chatStatus, setChatStatus] = useState<'pending' | 'approved' | 'not_found'>('pending')

    useEffect(() => {
        const fetchChatStatus = async () => {
            try {
                const status = await apiRequest(`/chats/${id}/status`, 'GET')
                setChatStatus(status)
                if (status === 'approved') {
                    fetchMessages()
                }
            } catch (error) {
                console.error('Error:', error)
                toast.error('Failed to fetch chat status')
                setChatStatus('not_found')
            }
        }

        fetchChatStatus()
    }, [id])

    const fetchMessages = async () => {
        try {
            const messagesData = await apiRequest(`/messages/chat/${id}`, 'GET')
            setMessages(messagesData)
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to fetch messages')
        }
    }

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const messageData = {
                chatId: id,
                content: newMessage,
                ...(isARMessage && {
                    latitude: arLocation.latitude,
                    longitude: arLocation.longitude,
                    altitude: arLocation.altitude,
                }),
            }
            const sentMessage = await apiRequest('/messages', 'POST', messageData)
            setMessages([...messages, sentMessage])
            setNewMessage('')
            setIsARMessage(false)
            setARLocation({ latitude: 0, longitude: 0, altitude: 0 })
            toast.success('Message sent')
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to send message')
        }
    }

    const toggleARMessage = () => {
        setIsARMessage(!isARMessage)
        if (!isARMessage) {
            // Get current location
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setARLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        altitude: position.coords.altitude || 0,
                    })
                },
                (error) => {
                    console.error('Error getting location:', error)
                    toast.error('Failed to get current location')
                }
            )
        }
    }

    if (chatStatus === 'pending') {
        return (
            <div className="flex justify-center items-center h-screen">
                <Card className="p-6 max-w-md">
                    <CardContent>
                        <h2 className="text-2xl font-bold mb-4">Chat Request Pending</h2>
                        <p className="text-gray-300 mb-4">This chat is waiting for approval. Once approved, you'll be able to start messaging.</p>
                        <Button onClick={() => router.push('/dashboard')} className="w-full">
                            Return to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (chatStatus === 'not_found') {
        return (
            <div className="flex justify-center items-center h-screen">
                <Card className="p-6 max-w-md">
                    <CardContent>
                        <h2 className="text-2xl font-bold mb-4">Chat Not Found</h2>
                        <p className="text-gray-300 mb-4">The requested chat does not exist or you don't have access to it.</p>
                        <Button onClick={() => router.push('/dashboard')} className="w-full">
                            Return to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-full flex flex-col"
        >
            <h1 className="text-4xl font-bold mb-6 text-gradient">Chat</h1>
            <div className="flex-1 overflow-y-auto mb-4 bg-gray-800 p-4 rounded-lg">
                <AnimatePresence>
                    {messages.map((message) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="mb-4">
                                <CardContent className="p-4">
                                    <p className="font-semibold">{message.sender.username}</p>
                                    <p className="text-gray-300">{message.content}</p>
                                    <p className="text-xs text-gray-500">{new Date(message.sentAt).toLocaleString()}</p>
                                    {message.arMessage && (
                                        <div className="mt-2 text-xs text-blue-400">
                                            <MapPin className="inline-block mr-1" size={12} />
                                            AR Message: Lat {message.arMessage.latitude.toFixed(6)},
                                            Lon {message.arMessage.longitude.toFixed(6)}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            <form onSubmit={sendMessage} className="flex flex-col space-y-2">
                <div className="flex space-x-2">
                    <Input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                        placeholder="Type your message..."
                    />
                    <Button type="submit" variant="default">
                        <Send className="mr-2 h-4 w-4" /> Send
                    </Button>
                </div>
                <div className="flex items-center space-x-2">
                    <Button type="button" onClick={toggleARMessage} variant={isARMessage ? "secondary" : "outline"}>
                        <MapPin className="mr-2 h-4 w-4" />
                        {isARMessage ? 'Cancel AR' : 'Add AR Location'}
                    </Button>
                    {isARMessage && (
                        <span className="text-sm text-gray-400">
                            AR Location: {arLocation.latitude.toFixed(6)}, {arLocation.longitude.toFixed(6)}
                        </span>
                    )}
                </div>
            </form>
        </motion.div>
    )
}


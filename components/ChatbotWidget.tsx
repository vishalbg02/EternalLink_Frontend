"use client"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, X, Send, AlertCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiRequest } from "@/utils/api" // Import the apiRequest utility

interface Message {
    id: string
    sender: "user" | "bot"
    text: string
    timestamp: Date
}

interface ChatbotRequestBody {
    question: string
}

export default function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            sender: "bot",
            text: "Hi there! I'm your EternalLink assistant. How can I help you today?",
            timestamp: new Date()
        }
    ])
    const [inputValue, setInputValue] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    const toggleChat = () => {
        setIsOpen(!isOpen)
        setError(null)
    }

    const handleSendMessage = async () => {
        if (inputValue.trim() === "") return

        setError(null)

        const userMessage: Message = {
            id: Date.now().toString(),
            sender: "user",
            text: inputValue,
            timestamp: new Date()
        }

        setMessages((prev) => [...prev, userMessage])
        setInputValue("")
        setIsTyping(true)

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token')
            console.log("Token retrieved:", token) // Debug: Log the token value

            if (!token) {
                throw new Error("Authentication token is missing. Please log in again.")
            }

            const requestBody: ChatbotRequestBody = {
                question: userMessage.text
            }

            // Fixed endpoint path to avoid duplication with API_BASE_URL
            const response = await apiRequest("/chatbot/ask", "POST", requestBody)

            if (!response.success) {
                throw new Error(response.message || "Failed to get response from chatbot")
            }

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                sender: "bot",
                text: response.data,
                timestamp: new Date()
            }

            setMessages((prev) => [...prev, botMessage])
        } catch (err) {
            console.error("Chatbot error:", err)
            const errorMsg = err instanceof Error ? err.message : "An unknown error occurred"
            setError(errorMsg)

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                sender: "bot",
                text: `Sorry, I encountered an error: ${errorMsg}. Please try again later.`,
                timestamp: new Date()
            }

            setMessages((prev) => [...prev, errorMessage])
        } finally {
            setIsTyping(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    return (
        <>
            <Button
                onClick={toggleChat}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg z-50 flex items-center justify-center"
                aria-label="Open chat"
            >
                <MessageSquare className="h-6 w-6" />
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed bottom-24 right-6 w-80 sm:w-96 z-50"
                    >
                        <Card className="bg-gray-800 border-gray-700 shadow-xl h-[32rem] flex flex-col">
                            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-gray-700">
                                <div className="flex items-center">
                                    <Avatar className="h-8 w-8 mr-2">
                                        <AvatarImage src="/chatbot-avatar.jpg" alt="EternalLink Assistant" />
                                        <AvatarFallback className="bg-blue-600">EL</AvatarFallback>
                                    </Avatar>
                                    <CardTitle className="text-lg text-white">EternalLink Assistant</CardTitle>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleChat}
                                    className="h-8 w-8 rounded-full hover:bg-gray-700"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </CardHeader>

                            <CardContent className="flex-1 overflow-y-auto py-4 px-4 space-y-4">
                                {error && (
                                    <Alert variant="destructive" className="bg-red-900 border-red-800 text-white">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${
                                            message.sender === "user" ? "justify-end" : "justify-start"
                                        }`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                                message.sender === "user"
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-gray-700 text-gray-100"
                                            }`}
                                        >
                                            <p className="whitespace-pre-wrap">{message.text}</p>
                                            <div
                                                className={`text-xs mt-1 ${
                                                    message.sender === "user" ? "text-blue-200" : "text-gray-400"
                                                }`}
                                            >
                                                {message.timestamp.toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-700 text-white rounded-lg px-4 py-2 max-w-[80%]">
                                            <div className="flex space-x-1">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </CardContent>

                            <CardFooter className="p-2 border-t border-gray-700">
                                <div className="flex items-center w-full space-x-2">
                                    <Textarea
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        placeholder="Type a message..."
                                        className="resize-none flex-1 bg-gray-700 border-gray-600 text-white"
                                        rows={1}
                                        disabled={isTyping}
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={inputValue.trim() === "" || isTyping}
                                        className="bg-blue-600 hover:bg-blue-700 h-10 w-10 p-0 rounded-full"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
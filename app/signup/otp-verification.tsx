"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Shield, AlertCircle, ArrowRight } from "lucide-react"
import toast from "react-hot-toast"
import { apiRequest } from "@/utils/api"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"

interface OtpVerificationProps {
    email: string
    username: string
    password: string
}

interface ColorItemProps {
    color: string
    index: number
    moveColor: (dragIndex: number, hoverIndex: number) => void
}

const ColorItem: React.FC<ColorItemProps> = ({ color, index, moveColor }) => {
    const [{ isDragging }, drag] = useDrag({
        type: "color",
        item: { index },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    })

    const [, drop] = useDrop({
        accept: "color",
        hover(item: { index: number }) {
            if (item.index !== index) {
                moveColor(item.index, index)
                item.index = index
            }
        },
    })

    return (
        <div
            ref={(node) => drag(drop(node))}
            className={`w-12 h-12 rounded-full cursor-move ${isDragging ? "opacity-50" : ""}`}
            style={{ backgroundColor: color }}
        />
    )
}

export default function OtpVerification({ email, username, password }: OtpVerificationProps) {
    const [colors, setColors] = useState<string[]>([])
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const fetchColors = async () => {
            try {
                const response = await apiRequest(`/auth/verification-colors?email=${email}`, "GET")
                setColors(response.colors)
            } catch (error) {
                console.error("Failed to fetch verification colors:", error)
                setError("Failed to load verification colors. Please try again.")
            }
        }
        fetchColors()
    }, [email])

    const moveColor = (dragIndex: number, hoverIndex: number) => {
        const draggedColor = colors[dragIndex]
        const newColors = [...colors]
        newColors.splice(dragIndex, 1)
        newColors.splice(hoverIndex, 0, draggedColor)
        setColors(newColors)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            await apiRequest("/auth/verify-otp", "POST", { email, username, password, colorSequence: colors.slice(0, 5) })
            toast.success("Account created successfully! You can now log in.")
            router.push("/login")
        } catch (error) {
            console.error("OTP verification failed:", error)
            setError(error instanceof Error ? error.message : "OTP verification failed. Please try again.")
            toast.error("OTP verification failed. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-700">
                    <div className="flex justify-center mb-8">
                        <motion.div
                            initial={{ rotate: -10 }}
                            animate={{ rotate: 0 }}
                            transition={{ duration: 0.6, type: "spring" }}
                            className="p-3 bg-purple-500/10 rounded-xl"
                        >
                            <Shield className="w-12 h-12 text-purple-400" />
                        </motion.div>
                    </div>

                    <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                        Verify OTP
                    </h2>
                    <p className="text-gray-400 text-center mb-8">
                        Arrange the colors in the correct sequence to verify your email
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <DndProvider backend={HTML5Backend}>
                            <div className="flex justify-center space-x-4">
                                {colors.map((color, index) => (
                                    <ColorItem key={index} color={color} index={index} moveColor={moveColor} />
                                ))}
                            </div>
                        </DndProvider>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg"
                            >
                                <AlertCircle className="w-5 h-5" />
                                <p className="text-sm">{error}</p>
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed relative group"
                        >
              <span className="flex items-center justify-center gap-2">
                {isLoading ? "Verifying..." : "Verify OTP"}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    )
}


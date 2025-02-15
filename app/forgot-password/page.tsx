"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Shield, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"
import { apiRequest } from "@/utils/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

enum ForgotPasswordStep {
    EMAIL = 0,
    EMOJI_SEQUENCE = 1,
    NEW_PASSWORD = 2,
}

export default function ForgotPassword() {
    const [email, setEmail] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState<ForgotPasswordStep>(ForgotPasswordStep.EMAIL)
    const [emojiSequence, setEmojiSequence] = useState<string[]>([])
    const [verificationEmojis, setVerificationEmojis] = useState<string[]>([])
    const router = useRouter()

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)
        try {
            const response = await apiRequest("/auth/forgot-password", "POST", { email })
            if (response.success) {
                toast.success("Emoji sequence sent to your email")
                const emojisResponse = await apiRequest(`/auth/verification-emojis?email=${email}`, "GET")
                setVerificationEmojis(emojisResponse.emojis)
                setStep(ForgotPasswordStep.EMOJI_SEQUENCE)
            } else {
                setError(response.message || "Failed to send emoji sequence. Please try again.")
            }
        } catch (error) {
            setError(`An error occurred: ${error instanceof Error ? error.message : String(error)}`)
            toast.error("Failed to send emoji sequence. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleEmojiSequenceSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)
        try {
            // Instead of verifying the emoji sequence separately, we'll just move to the next step
            // The actual verification will happen when resetting the password
            setStep(ForgotPasswordStep.NEW_PASSWORD)
        } catch (error) {
            setError(`An error occurred: ${error instanceof Error ? error.message : String(error)}`)
            toast.error("Failed to proceed. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleNewPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match")
            return
        }
        setIsLoading(true)
        try {
            const response = await apiRequest("/auth/reset-password", "POST", { email, emojiSequence, newPassword })
            if (response.success) {
                toast.success("Password reset successfully")
                router.push("/login")
            } else {
                setError(response.message || "Failed to reset password. Please try again.")
            }
        } catch (error) {
            setError(`An error occurred: ${error instanceof Error ? error.message : String(error)}`)
            toast.error("Failed to reset password. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleEmojiClick = (emoji: string) => {
        if (emojiSequence.includes(emoji)) {
            setEmojiSequence(emojiSequence.filter((e) => e !== emoji))
        } else if (emojiSequence.length < 5) {
            setEmojiSequence([...emojiSequence, emoji])
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
            <div className="absolute top-6 left-6">
                <Link href="/" className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
                    <Shield className="w-6 h-6" />
                    <span className="font-semibold">EternalLink</span>
                </Link>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                <Card className="bg-gray-800/50 backdrop-blur-xl shadow-2xl border border-gray-700">
                    <CardContent className="p-8">
                        <div className="flex justify-center mb-8">
                            <motion.div
                                initial={{ rotate: -10 }}
                                animate={{ rotate: 0 }}
                                transition={{ duration: 0.6, type: "spring" }}
                                className="p-3 bg-blue-500/10 rounded-xl"
                            >
                                <Shield className="w-12 h-12 text-blue-400" />
                            </motion.div>
                        </div>

                        <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                            Forgot Password
                        </h2>
                        <p className="text-gray-400 text-center mb-8">
                            {step === ForgotPasswordStep.EMAIL && "Enter your email to receive password reset instructions"}
                            {step === ForgotPasswordStep.EMOJI_SEQUENCE && "Select the emoji sequence sent to your email"}
                            {step === ForgotPasswordStep.NEW_PASSWORD && "Enter your new password"}
                        </p>

                        {step === ForgotPasswordStep.EMAIL && (
                            <form onSubmit={handleEmailSubmit} className="space-y-6">
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-hover:text-blue-400" />
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-gray-700/50 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-gray-600 group-hover:border-blue-400"
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed relative group"
                                >
                  <span className="flex items-center justify-center gap-2">
                    {isLoading ? "Sending..." : "Send Emoji Sequence"}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                                </Button>
                            </form>
                        )}

                        {step === ForgotPasswordStep.EMOJI_SEQUENCE && (
                            <form onSubmit={handleEmojiSequenceSubmit} className="space-y-6">
                                <div className="flex flex-wrap justify-center gap-2">
                                    {verificationEmojis.map((emoji, index) => (
                                        <Button
                                            key={index}
                                            type="button"
                                            onClick={() => handleEmojiClick(emoji)}
                                            className={`text-2xl p-2 ${emojiSequence.includes(emoji) ? "bg-blue-500" : "bg-gray-700"}`}
                                        >
                                            {emoji}
                                        </Button>
                                    ))}
                                </div>
                                <div className="text-center text-gray-400">Selected sequence: {emojiSequence.join(" ")}</div>
                                <Button
                                    type="submit"
                                    disabled={isLoading || emojiSequence.length !== 5}
                                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed relative group"
                                >
                  <span className="flex items-center justify-center gap-2">
                    {isLoading ? "Verifying..." : "Verify Emoji Sequence"}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                                </Button>
                            </form>
                        )}

                        {step === ForgotPasswordStep.NEW_PASSWORD && (
                            <form onSubmit={handleNewPasswordSubmit} className="space-y-6">
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-hover:text-blue-400" />
                                    <Input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-gray-700/50 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-gray-600 group-hover:border-blue-400"
                                        placeholder="Enter new password"
                                        required
                                    />
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-hover:text-blue-400" />
                                    <Input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-gray-700/50 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-gray-600 group-hover:border-blue-400"
                                        placeholder="Confirm new password"
                                        required
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed relative group"
                                >
                  <span className="flex items-center justify-center gap-2">
                    {isLoading ? "Resetting..." : "Reset Password"}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                                </Button>
                            </form>
                        )}

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg mt-4"
                            >
                                <AlertCircle className="w-5 h-5" />
                                <p className="text-sm">{error}</p>
                            </motion.div>
                        )}

                        <div className="mt-8 text-center">
                            <Link href="/login" className="text-sm text-gray-400 hover:text-blue-400 transition-colors">
                                Remember your password? Sign In
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}


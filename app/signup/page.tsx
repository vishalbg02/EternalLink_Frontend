"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Shield, User, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2, ArrowLeft } from "lucide-react"
import toast from "react-hot-toast"
import { apiRequest } from "@/utils/api"
import OtpVerification from "./otp-verification"

export default function Signup() {
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [showOtpVerification, setShowOtpVerification] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            await apiRequest("/auth/signup", "POST", { username, email, password })
            toast.success("OTP sent to your email. Please verify to complete signup.")
            setShowOtpVerification(true)
        }catch (error) {
            console.error("Signup initiation failed:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            setError(error instanceof Error ? error.message : "Account creation failed. Please try again.");
            toast.error("Signup initiation failed. Please try again.");
        } finally {
            setIsLoading(false)
        }
    }

    if (showOtpVerification) {
        return <OtpVerification email={email} username={username} password={password} />
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
                        Create Account
                    </h2>
                    <p className="text-gray-400 text-center mb-8">Join the next generation of secure messaging</p>

                    <div className="mb-8 space-y-3">
                        <div className="flex items-center gap-3 text-green-400 bg-green-400/10 p-3 rounded-lg">
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm">Quantum-resistant encryption for ultimate security</p>
                        </div>
                        <div className="flex items-center gap-3 text-blue-400 bg-blue-400/10 p-3 rounded-lg">
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm">Advanced AI-powered messaging assistance</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative group">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-hover:text-purple-400" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-gray-700/50 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all border border-gray-600 group-hover:border-purple-400"
                                placeholder="Choose a username"
                                required
                            />
                        </div>

                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-hover:text-purple-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-700/50 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all border border-gray-600 group-hover:border-purple-400"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-hover:text-purple-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-700/50 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all border border-gray-600 group-hover:border-purple-400"
                                placeholder="Create a strong password"
                                required
                            />
                        </div>

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
                {isLoading ? "Creating Account..." : "Create Secure Account"}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
                        </button>
                    </form>

                    <div className="mt-8 space-y-4">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-700"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-gray-800/50 text-gray-400">Already have an account?</span>
                            </div>
                        </div>

                        <Link
                            href="/login"
                            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-blue-500/20 text-blue-400 hover:bg-blue-500/10 transition-all group"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Sign In to Your Account
                        </Link>
                    </div>

                    <p className="mt-6 text-center text-sm text-gray-400">
                        By creating an account, you agree to our{" "}
                        <Link href="/terms" className="text-purple-400 hover:text-purple-300 transition-colors">
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-purple-400 hover:text-purple-300 transition-colors">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
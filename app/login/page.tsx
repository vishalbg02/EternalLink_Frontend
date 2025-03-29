'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Shield, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiRequest } from '@/utils/api'


export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)
        try {
            const response = await apiRequest('/auth/signin', 'POST', { email, password })
            if (response.accessToken) {
                localStorage.setItem('token', response.accessToken)
                localStorage.setItem('tokenType', response.tokenType)
                toast.success('Welcome back to EternalLink!')
                router.push('/dashboard')
            } else {
                setError('Authentication failed. Please verify your credentials.')
                toast.error('Login failed. Please check your credentials.')
            }
        } catch (error) {
            setError(`Login failed: ${error instanceof Error ? error.message : String(error)}`)
            toast.error('Login attempt unsuccessful. Please try again.')
        } finally {
            setIsLoading(false)
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
                <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-700">
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
                        Welcome Back
                    </h2>
                    <p className="text-gray-400 text-center mb-8">
                        Secure access to your EternalLink account
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-hover:text-blue-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-700/50 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-gray-600 group-hover:border-blue-400"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-hover:text-blue-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-700/50 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-gray-600 group-hover:border-blue-400"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>
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
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed relative group"
                        >
                            <span className="flex items-center justify-center gap-2">
                                {isLoading ? 'Authenticating...' : 'Sign In'}
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
                                <span className="px-2 bg-gray-800/50 text-gray-400">New to EternalLink?</span>
                            </div>
                        </div>

                        <Link
                            href="/signup"
                            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-purple-500/20 text-purple-400 hover:bg-purple-500/10 transition-all group"
                        >
                            Create an Account
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>

                        <div className="text-center">
                            <Link href="/forgot-password" className="text-sm text-gray-400 hover:text-blue-400 transition-colors">
                                Forgot your password?
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
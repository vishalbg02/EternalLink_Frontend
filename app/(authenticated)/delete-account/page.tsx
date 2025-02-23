"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"
import { apiRequest } from "@/utils/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function DeleteAccountPage() {
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleDeleteAccount = async () => {
        if (!password) {
            toast.error("Please enter your password")
            return
        }

        setLoading(true)
        try {
            await apiRequest("/users/me", "DELETE", { password })
            localStorage.removeItem("token")
            toast.success("Account deleted successfully")
            router.push("/login")
        } catch (error) {
            console.error("Error deleting account:", error)
            toast.error("Failed to delete account. Please check your password and try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4"
        >
            <Card className="bg-gray-800 border-gray-700 w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-white">Delete Account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Warning</AlertTitle>
                        <AlertDescription>
                            This action is irreversible. All your data, including messages, chats, and profile information, will be permanently deleted.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                                Enter your password to confirm
                            </label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                disabled={loading}
                            />
                        </div>

                        <div className="flex justify-between">
                            <Button
                                variant="outline"
                                onClick={() => router.push("/dashboard")}
                                disabled={loading}
                                className="text-white border-gray-600 hover:bg-gray-700"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDeleteAccount}
                                disabled={loading}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {loading ? "Deleting..." : "Delete Account"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
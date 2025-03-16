"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Upload, X, ArrowLeft, Camera, Save, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import { apiRequest } from "@/utils/api"
import dynamic from 'next/dynamic'

// Dynamically import motion
const MotionDiv = dynamic(
    () => import('framer-motion').then((mod) => mod.motion.div),
    { ssr: false }
)

const MotionButton = dynamic(
    () => import('framer-motion').then((mod) => mod.motion.button),
    { ssr: false }
)

interface UserProfile {
    id: number
    username: string
    email: string
    bio: string
    status: string
    profilePhotoUrl: string
}

export default function ProfileEdit() {
    const router = useRouter()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [username, setUsername] = useState("")
    const [bio, setBio] = useState("")
    const [status, setStatus] = useState("")
    const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formChanged, setFormChanged] = useState(false)

    useEffect(() => {
        fetchProfile()
    }, [])

    useEffect(() => {
        if (profile) {
            const hasChanges =
                username !== profile.username ||
                bio !== (profile.bio || "") ||
                status !== (profile.status || "") ||
                profilePhoto !== null

            setFormChanged(hasChanges)
        }
    }, [username, bio, status, profilePhoto, profile])

    const fetchProfile = async () => {
        try {
            const userData = await apiRequest("/users/me", "GET")
            setProfile(userData.data)
            setUsername(userData.data.username)
            setBio(userData.data.bio || "")
            setStatus(userData.data.status || "")
            setLoading(false)
        } catch (error) {
            console.error("Error fetching profile:", error)
            toast.error("Failed to load profile")
            setLoading(false)
        }
    }

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setProfilePhoto(file)

            // Create preview URL
            const reader = new FileReader()
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const removePhoto = () => {
        setProfilePhoto(null)
        setPhotoPreview(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        const formData = new FormData()
        formData.append("username", username)
        formData.append("bio", bio)
        formData.append("status", status)
        if (profilePhoto) {
            formData.append("profilePhoto", profilePhoto)
        }

        try {
            const response = await apiRequest("/users/me", "PUT", formData, true)
            if (response.success) {
                toast.success("Profile updated successfully")
                router.push("/dashboard")
            } else {
                throw new Error(response.message || "Failed to update profile")
            }
        } catch (error) {
            console.error("Error updating profile:", error)
            toast.error("Failed to update profile")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
                <MotionDiv
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center space-y-4"
                >
                    <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                    <p className="text-xl font-medium text-white animate-pulse">Loading your profile...</p>
                </MotionDiv>
            </div>
        )
    }

    const backgroundVariants = {
        initial: {
            backgroundPosition: "0% 0%"
        },
        animate: {
            backgroundPosition: "100% 100%",
            transition: { duration: 20, repeat: Infinity, repeatType: "reverse" }
        }
    }

    return (
        <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="min-h-screen text-white p-6 md:p-8 lg:p-12"
            style={{
                background: "linear-gradient(-45deg, #0f172a, #1e293b, #334155, #1e293b)",
                backgroundSize: "400% 400%"
            }}
            variants={backgroundVariants}
        >
            <div className="max-w-4xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={() => router.push("/dashboard")}
                    className="mb-8 text-gray-300 hover:text-white hover:bg-gray-700/40 transition-all duration-300 group"
                >
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:translate-x-[-2px] transition-transform" />
                    Back to Dashboard
                </Button>

                <MotionDiv
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50 shadow-2xl overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 pb-8">
                            <CardTitle className="text-3xl font-bold text-white flex items-center">
                                <User className="mr-3 h-6 w-6 text-blue-400" />
                                Edit Your Profile
                            </CardTitle>
                            <CardDescription className="text-gray-300 mt-2">
                                Customize how others see you on the platform
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 pb-8">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <MotionDiv
                                    initial={{ y: -30, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="flex flex-col items-center -mt-16 mb-8 relative"
                                >
                                    <div className="relative group">
                                        <Avatar className="h-32 w-32 ring-4 ring-blue-500/80 ring-offset-4 ring-offset-gray-800 transition-all duration-300 group-hover:ring-blue-400 group-hover:scale-105">
                                            <AvatarImage
                                                src={photoPreview || profile?.profilePhotoUrl || "/placeholder-avatar.jpg"}
                                                alt={profile?.username}
                                                className="object-cover"
                                            />
                                            <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-600 to-blue-800">
                                                {profile?.username.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <label htmlFor="photo-upload" className="absolute bottom-0 right-0 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110">
                                            <Camera className="h-5 w-5" />
                                            <input
                                                id="photo-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePhotoChange}
                                                className="hidden"
                                            />
                                        </label>

                                        {photoPreview && (
                                            <MotionButton
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                type="button"
                                                onClick={removePhoto}
                                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1.5 shadow-md transition-colors duration-200"
                                            >
                                                <X className="h-4 w-4" />
                                            </MotionButton>
                                        )}
                                    </div>

                                    {photoPreview && (
                                        <p className="text-green-400 text-sm mt-4 font-medium">
                                            New photo selected! Save changes to update.
                                        </p>
                                    )}
                                </MotionDiv>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <MotionDiv
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.5, delay: 0.3 }}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1.5">
                                                Username
                                            </label>
                                            <Input
                                                id="username"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className="bg-gray-700/70 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                                                placeholder="Enter your username"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1.5">
                                                Status
                                            </label>
                                            <Input
                                                id="status"
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                                className="bg-gray-700/70 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                                                placeholder="What's on your mind?"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                                Email (non-editable)
                                            </label>
                                            <Input
                                                value={profile?.email}
                                                disabled
                                                className="bg-gray-700/50 border-gray-600 text-gray-400"
                                            />
                                        </div>
                                    </MotionDiv>

                                    <MotionDiv
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.5, delay: 0.4 }}
                                    >
                                        <div>
                                            <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1.5">
                                                Bio
                                            </label>
                                            <Textarea
                                                id="bio"
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                className="bg-gray-700/70 border-gray-600 text-white h-40 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                                                placeholder="Tell us about yourself..."
                                            />
                                        </div>
                                    </MotionDiv>
                                </div>

                                <MotionDiv
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.5 }}
                                    className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-4"
                                >
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full sm:w-1/2 border-gray-600 hover:bg-gray-700 hover:text-white transition-all duration-300"
                                        onClick={() => router.push("/dashboard")}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className={`w-full sm:w-1/2 transition-all duration-300 flex items-center justify-center gap-2 ${
                                            formChanged
                                                ? "bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
                                                : "bg-blue-600/50 text-gray-300 cursor-not-allowed"
                                        }`}
                                        disabled={saving || !formChanged}
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>Updating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                <span>Save Changes</span>
                                            </>
                                        )}
                                    </Button>
                                </MotionDiv>
                            </form>
                        </CardContent>
                    </Card>
                </MotionDiv>
            </div>
        </MotionDiv>
    )
}
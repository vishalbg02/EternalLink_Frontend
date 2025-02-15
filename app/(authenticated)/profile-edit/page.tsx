"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Upload, X, ArrowLeft } from "lucide-react"
import toast from "react-hot-toast"
import { apiRequest } from "@/utils/api"
import dynamic from 'next/dynamic'

// Dynamically import motion
const MotionDiv = dynamic(
    () => import('framer-motion').then((mod) => mod.motion.div),
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

    useEffect(() => {
        fetchProfile()
    }, [])

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
            <div className="flex justify-center items-center min-h-screen bg-gray-900">
                <MotionDiv
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-2xl font-bold text-white"
                >
                    Loading...
                </MotionDiv>
            </div>
        )
    }

    return (
        <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8"
        >
            <div className="max-w-md mx-auto">
                <Button
                    variant="ghost"
                    onClick={() => router.push("/dashboard")}
                    className="mb-6 text-gray-400 hover:text-white"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>

                <div className="max-w-2xl mx-auto">
                    <Card className="bg-gray-800 border-gray-700 shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold text-white flex items-center">
                                <User className="mr-2 h-6 w-6 text-blue-400" />
                                Edit Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="relative group">
                                        <Avatar className="h-32 w-32 ring-4 ring-blue-500 ring-offset-2 ring-offset-gray-800 transition-all duration-300">
                                            <AvatarImage
                                                src={photoPreview || profile?.profilePhotoUrl || "/placeholder-avatar.jpg"}
                                                alt={profile?.username}
                                                className="object-cover"
                                            />
                                            <AvatarFallback className="text-2xl">
                                                {profile?.username.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        {photoPreview && (
                                            <button
                                                type="button"
                                                onClick={removePhoto}
                                                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="photo-upload" className="cursor-pointer">
                                            <div className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-300">
                                                <Upload className="h-5 w-5" />
                                                <span>{photoPreview ? 'Change Photo' : 'Upload New Photo'}</span>
                                            </div>
                                            <input
                                                id="photo-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePhotoChange}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                                            Username
                                        </label>
                                        <Input
                                            id="username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">
                                            Bio
                                        </label>
                                        <Textarea
                                            id="bio"
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            className="bg-gray-700 border-gray-600 text-white h-24 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Tell us about yourself..."
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">
                                            Status
                                        </label>
                                        <Input
                                            id="status"
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            className="bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="What's on your mind?"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Email (non-editable)
                                        </label>
                                        <Input
                                            value={profile?.email}
                                            disabled
                                            className="bg-gray-700 border-gray-600 text-gray-400"
                                        />
                                    </div>
                                </div>

                                <div className="flex space-x-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => router.push("/dashboard")}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                        disabled={saving}
                                    >
                                        {saving ? "Updating..." : "Save Changes"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MotionDiv>
    )
}
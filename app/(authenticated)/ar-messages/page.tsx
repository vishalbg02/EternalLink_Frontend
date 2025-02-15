'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { apiRequest } from '@/utils/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, Search } from 'lucide-react'

interface ArMessage {
    id: number
    message: {
        content: string
        sender: {
            username: string
        }
    }
    latitude: number
    longitude: number
    altitude: number
    expiresAt: string
}

export default function ArMessages() {
    const [arMessages, setArMessages] = useState<ArMessage[]>([])
    const [latitude, setLatitude] = useState('')
    const [longitude, setLongitude] = useState('')
    const [radius, setRadius] = useState('')

    const fetchNearbyMessages = async () => {
        try {
            const messagesData = await apiRequest(`/ar-messages/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`, 'GET')
            setArMessages(messagesData)
            toast.success('AR messages fetched successfully')
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to fetch nearby AR messages')
        }
    }

    useEffect(() => {
        // Get user's current location when component mounts
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLatitude(position.coords.latitude.toString())
                setLongitude(position.coords.longitude.toString())
            },
            (error) => {
                console.error('Error getting location:', error)
                toast.error('Failed to get current location')
            }
        )
    }, [])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="container mx-auto px-4 py-8"
        >
            <h1 className="text-4xl font-bold mb-6 text-gradient">AR Messages</h1>
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Find Nearby Messages</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
                        <Input
                            type="number"
                            value={latitude}
                            onChange={(e) => setLatitude(e.target.value)}
                            placeholder="Latitude"
                            className="flex-1"
                        />
                        <Input
                            type="number"
                            value={longitude}
                            onChange={(e) => setLongitude(e.target.value)}
                            placeholder="Longitude"
                            className="flex-1"
                        />
                        <Input
                            type="number"
                            value={radius}
                            onChange={(e) => setRadius(e.target.value)}
                            placeholder="Radius (km)"
                            className="flex-1"
                        />
                    </div>
                    <Button onClick={fetchNearbyMessages} className="w-full">
                        <Search className="mr-2 h-4 w-4" /> Search
                    </Button>
                </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {arMessages.map((arMessage) => (
                    <Card key={arMessage.id} className="bg-gray-800">
                        <CardContent className="p-4">
                            <p className="font-semibold">{arMessage.message.sender.username}</p>
                            <p className="text-gray-300 mb-2">{arMessage.message.content}</p>
                            <p className="text-xs text-gray-500 flex items-center">
                                <MapPin className="mr-1 h-3 w-3" />
                                Lat: {arMessage.latitude.toFixed(6)}, Lon: {arMessage.longitude.toFixed(6)}
                            </p>
                            <p className="text-xs text-gray-500">Expires: {new Date(arMessage.expiresAt).toLocaleString()}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </motion.div>
    )
}


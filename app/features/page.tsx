'use client'

import { motion } from 'framer-motion'
import { Lock, Zap, Globe, Users, Smartphone, Brain } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const FeatureCard = ({ icon, title, description }) => (
    <Card>
        <CardContent className="p-6">
            <motion.div
                className="flex flex-col items-center text-center"
                whileHover={{ y: -5 }}
            >
                {icon}
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400">{description}</p>
            </motion.div>
        </CardContent>
    </Card>
)

const features = [
    {
        icon: <Lock className="w-12 h-12 mb-4 text-blue-500" />,
        title: 'Quantum-Resistant Encryption',
        description: 'Future-proof your communications with our advanced encryption technology, ensuring your messages remain secure even in the face of quantum computing advancements.'
    },
    {
        icon: <Zap className="w-12 h-12 mb-4 text-yellow-500" />,
        title: 'Lightning-Fast Messaging',
        description: 'Experience real-time messaging with unparalleled speed. Our optimized infrastructure ensures your messages are delivered instantly, no matter where you are in the world.'
    },
    {
        icon: <Globe className="w-12 h-12 mb-4 text-green-500" />,
        title: 'Global Accessibility',
        description: 'Connect with anyone, anywhere in the world, securely and effortlessly. EternalLink breaks down communication barriers, bringing people closer together.'
    },
    {
        icon: <Users className="w-12 h-12 mb-4 text-purple-500" />,
        title: 'Decentralized Network',
        description: 'Enjoy the benefits of a truly decentralized messaging platform. Your data isn't controlled by any single entity, ensuring maximum privacy and resistance to censorship.'
    },
    {
        icon: <Smartphone className="w-12 h-12 mb-4 text-pink-500" />,
        title: 'AR Message Placement',
        description: 'Leave virtual messages in real-world locations with our cutting-edge AR technology. Create immersive experiences and discover messages in a whole new way.'
    },
    {
        icon: <Brain className="w-12 h-12 mb-4 text-indigo-500" />,
        title: 'AI-Powered Assistance',
        description: 'Benefit from our intelligent AI assistant that helps you compose messages, provides context-aware suggestions, and enhances your overall communication experience.'
    }
]

export default function Features() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white py-20">
            <motion.div
                className="w-full max-w-6xl px-4 sm:px-6 lg:px-8"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
            >
                <h1 className="text-4xl sm:text-5xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    EternalLink Features
                </h1>
                <p className="text-xl mb-12 text-center text-gray-600 dark:text-gray-300">
                    Discover the innovative features that make EternalLink the future of secure communication.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                        >
                            <FeatureCard {...feature} />
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}


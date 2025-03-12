"use client"

import { motion } from 'framer-motion'
import { Lock, Zap, Globe, Users, Smartphone, Brain } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image' // Assuming Next.js Image component for background

// Import Google Fonts (add this in your _app.js or a global CSS file)
import { Rajdhani, Roboto_Mono } from 'next/font/google'

const rajdhani = Rajdhani({
    weight: ['700'], // Bold weight for heading
    subsets: ['latin'],
})

const robotoMono = Roboto_Mono({
    weight: ['400'], // Regular weight for paragraph
    subsets: ['latin'],
})

const FeatureCard = ({ icon, title, description }) => (
    <Card className="bg-white dark:bg-gray-800 border-none shadow-lg w-full h-[300px] flex items-center justify-center">
        <CardContent className="p-6 flex flex-col items-center text-center h-full">
            <motion.div
                className="flex flex-col items-center justify-between h-full"
                whileHover={{ y: -5, scale: 1.05 }} // Consistent scaling
                transition={{ duration: 0.3 }}
            >
                {icon}
                <h3 className="text-teal-500 dark:text-teal-400 text-lg font-semibold mt-4 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 flex-1">{description}</p>
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
        description: 'Enjoy the benefits of a truly decentralized messaging platform. Your data is not controlled by any single entity, ensuring maximum privacy and resistance to censorship.'
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
        <div className="relative min-h-screen bg-gray-900 text-white py-20 overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/background.jpg" 
                    alt="Bgm"
                    layout="fill"
                    objectFit="cover"
                    objectPosition="center"
                    className="opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent"></div>
            </div>

            <motion.div
                className="relative z-10 w-full max-w-6xl px-4 sm:px-6 lg:px-8 mx-auto"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
            >
                <Card className="bg-white dark:bg-gray-800 border-none shadow-lg mb-12">
                    <CardContent className="p-6 text-center">
                        <h1 className={`${rajdhani.className} text-4xl sm:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400 drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]`}>
                            EternalLink Features
                        </h1>
                        <p className={`${robotoMono.className} text-lg text-gray-300 tracking-wide leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]`}>
                            Discover the innovative features that make EternalLink the future of secure communication.
                        </p>
                    </CardContent>
                </Card>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.slice(0, 4).map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                        >
                            <FeatureCard {...feature} />
                        </motion.div>
                    ))}
                    <div className="col-span-2 col-start-2 flex flex-row gap-6">
                        {features.slice(4).map((feature, index) => (
                            <motion.div
                                key={index + 4}
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: (index + 4) * 0.1, duration: 0.5 }}
                            >
                                <FeatureCard {...feature} />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
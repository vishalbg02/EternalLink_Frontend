'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function About() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white py-20">
            <motion.div
                className="w-full max-w-4xl px-4 sm:px-6 lg:px-8"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
            >
                <h1 className="text-4xl sm:text-5xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    About EternalLink
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
                    <div>
                        <p className="text-lg mb-6 text-gray-600 dark:text-gray-300">
                            EternalLink was born from a vision to create a communication platform that prioritizes security, privacy, and innovation. Our team of passionate developers, cryptographers, and designers came together with a shared goal: to revolutionize the way people connect and share information in the digital age.
                        </p>
                        <p className="text-lg mb-6 text-gray-600 dark:text-gray-300">
                            We believe that everyone deserves access to secure, private communication tools that are both powerful and easy to use. That's why we've developed EternalLink with cutting-edge technologies like quantum-resistant encryption, augmented reality messaging, and AI-powered assistance.
                        </p>
                    </div>
                    <div className="relative h-64 md:h-full">
                        <Image
                            src="/placeholder.svg?height=400&width=400"
                            alt="EternalLink Team"
                            layout="fill"
                            objectFit="cover"
                            className="rounded-lg shadow-lg"
                        />
                    </div>
                </div>
                <h2 className="text-3xl font-bold mb-6 text-center">Our Mission</h2>
                <p className="text-lg mb-8 text-center text-gray-600 dark:text-gray-300">
                    To empower individuals and organizations with secure, innovative communication tools that protect privacy, foster connection, and push the boundaries of what's possible in digital interaction.
                </p>
                <h2 className="text-3xl font-bold mb-6 text-center">Our Values</h2>
                <ul className="list-disc list-inside mb-8 text-lg text-gray-600 dark:text-gray-300">
                    <li>Privacy-first approach in all our technologies</li>
                    <li>Continuous innovation to stay ahead of security threats</li>
                    <li>User-centric design for intuitive experiences</li>
                    <li>Transparency in our operations and technology</li>
                    <li>Commitment to ethical data practices</li>
                </ul>
                <div className="text-center">
                    <Button size="lg" className="text-lg">
                        Join Our Journey <ArrowRight className="ml-2" />
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}


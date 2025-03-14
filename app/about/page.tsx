"use client"

import { motion } from 'framer-motion'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Import Google Fonts
import { Rajdhani, Roboto_Mono } from 'next/font/google'

const rajdhani = Rajdhani({
    weight: ['700'], // Bold weight for headings
    subsets: ['latin'],
})

const robotoMono = Roboto_Mono({
    weight: ['400'], // Regular weight for text
    subsets: ['latin'],
})

export default function About() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden py-20">
            {/* Image Background */}
            <Image
                src="/images/background.jpg"
                alt="Background"
                layout="fill"
                objectFit="cover"
                className="absolute top-0 left-0 w-full h-full opacity-50 z-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent z-0"></div>

            <motion.div
                className="w-full max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
            >
                <h1 className={`${rajdhani.className} text-4xl sm:text-5xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400 drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]`}>
                    About EternalLink
                </h1>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* First Paragraph Container */}
                    <motion.div
                        className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <p className={`${robotoMono.className} text-lg mb-6 text-gray-300 tracking-wide leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]`}>
                            EternalLink was born from a vision to create a communication platform that prioritizes security, privacy, and innovation. Our team of passionate developers, cryptographers, and designers came together with a shared goal: to revolutionize the way people connect and share information in the digital age.
                        </p>
                    </motion.div>
                    {/* Team Image */}
                    <motion.div
                        className="relative h-64 lg:h-96"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <Image
                            src="/images/vishal.jpg?height=400&width=400"
                            alt="EternalLink Team"
                            layout="fill"
                            objectFit="cover"
                            className="rounded-lg shadow-lg"
                        />
                    </motion.div>
                </div>
                {/* Second Paragraph and New Image Container */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12">
                    {/* New Image */}
                    <motion.div
                        className="relative h-64 lg:h-96"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        <Image
                            src="/images/valencia.jpg?height=400&width=400"
                            alt="EternalLink Technology"
                            layout="fill"
                            objectFit="cover"
                            className="rounded-lg shadow-lg"
                        />
                    </motion.div>
                    {/* Second Paragraph Container */}
                    <motion.div
                        className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        <p className={`${robotoMono.className} text-lg mb-6 text-gray-300 tracking-wide leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]`}>
                            We believe that everyone deserves access to secure, private communication tools that are both powerful and easy to use. That's why we've developed EternalLink with cutting-edge technologies like quantum-resistant encryption, augmented reality messaging, and AI-powered assistance.
                        </p>
                    </motion.div>
                </div>
                {/* Our Mission Container */}
                <motion.div
                    className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg mt-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                >
                    <h2 className={`${rajdhani.className} text-3xl font-bold mb-6 text-center`}>Our Mission</h2>
                    <p className={`${robotoMono.className} text-lg mb-8 text-center text-gray-300 tracking-wide leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]`}>
                        To empower individuals and organizations with secure, innovative communication tools that protect privacy, foster connection, and push the boundaries of what's possible in digital interaction.
                    </p>
                </motion.div>
                {/* Our Values Container */}
                <motion.div
                    className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg mt-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                >
                    <h2 className={`${rajdhani.className} text-3xl font-bold mb-6 text-center`}>Our Values</h2>
                    <ul className="list-disc list-inside mb-8 text-lg text-gray-300">
                        <li className={`${robotoMono.className} tracking-wide leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]`}>Privacy-first approach in all our technologies</li>
                        <li className={`${robotoMono.className} tracking-wide leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]`}>Continuous innovation to stay ahead of security threats</li>
                        <li className={`${robotoMono.className} tracking-wide leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]`}>User-centric design for intuitive experiences</li>
                        <li className={`${robotoMono.className} tracking-wide leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]`}>Transparency in our operations and technology</li>
                        <li className={`${robotoMono.className} tracking-wide leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]`}>Commitment to ethical data practices</li>
                    </ul>
                </motion.div>
                {/* Button Container with Space */}
                <div className="text-center mt-12">
                    <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:shadow-teal-500/25 text-lg">
                        Join Our Journey <ArrowRight className="ml-2" />
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}
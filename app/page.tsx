"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image, { StaticImageData } from 'next/image'
import { motion, useAnimation, AnimatePresence, MotionProps } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { ArrowRight, Lock, Zap, Globe, Users, Smartphone, Brain } from 'lucide-react'

// Import Google Fonts
import { Rajdhani, Roboto_Mono } from 'next/font/google'

// Define types for components
interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

interface TestimonialCardProps {
    name: string;
    role: string;
    quote: string;
    image: string | StaticImageData;
}

// Custom motion div props interface with className
interface MotionDivProps extends MotionProps {
    className?: string;
    children: React.ReactNode;
}

const rajdhani = Rajdhani({
    weight: ['700'], // Bold weight for headings
    subsets: ['latin'],
})

const robotoMono = Roboto_Mono({
    weight: ['400'], // Regular weight for text
    subsets: ['latin'],
})

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
    <motion.div {...{ className: '' } as MotionDivProps}
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg transition-all duration-300 ease-in-out hover:scale-105"
        whileHover={{ y: -5 }}
    >
        {icon}
        <h3 className={`${rajdhani.className} text-xl font-semibold mb-2 text-teal-500 dark:text-teal-400`}>{title}</h3>
        <p className={`${robotoMono.className} text-gray-300 text-sm`}>{description}</p>
    </motion.div>
)

const TestimonialCard: React.FC<TestimonialCardProps> = ({ name, role, quote, image }) => (
    <motion.div {...{ className: '' } as MotionDivProps}
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
        <p className={`${robotoMono.className} text-lg italic mb-4 text-gray-300`}>"{quote}"</p>
        <div className="flex items-center">
            <Image
                src={image}
                alt={name}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full mr-4"
            />
            <div>
                <p className={`${rajdhani.className} font-semibold text-teal-500 dark:text-teal-400`}>{name}</p>
                <p className={`${robotoMono.className} text-sm text-gray-400`}>{role}</p>
            </div>
        </div>
    </motion.div>
)

export default function Home() {
    const [currentFeature, setCurrentFeature] = useState(0)
    const features = [
        { icon: <Lock className="w-12 h-12 mb-4 text-blue-400" />, title: 'Quantum-Resistant Encryption', description: 'Future-proof your communications with our advanced encryption technology, ensuring your messages remain secure even in the face of quantum computing advancements.' },
        { icon: <Zap className="w-12 h-12 mb-4 text-yellow-400" />, title: 'Lightning-Fast Messaging', description: 'Experience real-time messaging with unparalleled speed. Our optimized infrastructure ensures your messages are delivered instantly, no matter where you are in the world.' },
        { icon: <Globe className="w-12 h-12 mb-4 text-green-400" />, title: 'Global Accessibility', description: 'Connect with anyone, anywhere in the world, securely and effortlessly. EternalLink breaks down communication barriers, bringing people closer together.' },
        { icon: <Users className="w-12 h-12 mb-4 text-purple-400" />, title: 'Decentralized Network', description: 'Enjoy the benefits of a truly decentralized messaging platform. Your data isn\'t controlled by any single entity, ensuring maximum privacy and resistance to censorship.' },
        { icon: <Smartphone className="w-12 h-12 mb-4 text-pink-400" />, title: 'AR Message Placement', description: 'Leave virtual messages in real-world locations with our cutting-edge AR technology. Create immersive experiences and discover messages in a whole new way.' },
        { icon: <Brain className="w-12 h-12 mb-4 text-indigo-400" />, title: 'AI-Powered Assistance', description: 'Benefit from our intelligent AI assistant that helps you compose messages, provides context-aware suggestions, and enhances your overall communication experience.' },
    ]

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentFeature((prev) => (prev + 1) % features.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    const controls = useAnimation()
    const [ref, inView] = useInView()

    useEffect(() => {
        if (inView) {
            controls.start('visible')
        }
    }, [controls, inView])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-transparent text-white relative overflow-hidden">
            {/* Video Background */}
            <video autoPlay loop muted className="absolute top-0 left-0 w-full h-full object-cover opacity-50 z-0">
                <source src="/securityvid.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent z-0"></div>

            {/* Header - Adjusted z-index */}
            <header className="w-full bg-gray-900/80 backdrop-blur-lg fixed top-0 z-20 border-b border-gray-800">
                <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="text-2xl font-bold text-teal-400 hover:text-teal-300 transition-colors">
                        EternalLink
                    </Link>
                    <div className="space-x-6">
                        <Link href="/about" className="hover:text-teal-400 transition duration-300">About</Link>
                        <Link href="/features" className="hover:text-teal-400 transition duration-300">Features</Link>
                        <Link href="/contact" className="hover:text-teal-400 transition duration-300">Contact</Link>
                    </div>
                </nav>
            </header>

            <main className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-20 text-center relative z-10">
                {/* Hero Section */}
                <motion.div {...{ className: '' } as MotionDivProps}
                    className="w-full max-w-4xl pt-32 md:pt-40"
                    initial={{opacity: 0, y: -50}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.8, ease: 'easeOut'}}
                >
                    <h1 className={`${rajdhani.className} text-5xl sm:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400 drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]`}>
                        Welcome to EternalLink
                    </h1>
                    <p className={`${robotoMono.className} text-xl sm:text-2xl mb-12 max-w-2xl mx-auto text-gray-300 tracking-wide leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]`}>
                        Experience the future of secure, decentralized communication with cutting-edge AR capabilities and AI-powered assistance.
                    </p>
                </motion.div>

                {/* CTA Buttons */}
                <motion.div {...{ className: '' } as MotionDivProps}
                    className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 mb-20"
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{delay: 0.4, duration: 0.5}}
                >
                    <Link href="/login"
                          className="group bg-teal-500 hover:bg-teal-600 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:shadow-teal-500/25 flex items-center justify-center">
                        Login
                        <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform"/>
                    </Link>
                    <Link href="/signup"
                          className="group bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 flex items-center justify-center">
                        Sign Up
                        <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform"/>
                    </Link>
                </motion.div>

                {/* Features Section */}
                <motion.div {...{ className: '' } as MotionDivProps}
                    ref={ref}
                    animate={controls}
                    initial="hidden"
                    variants={{
                        visible: {opacity: 1, y: 0},
                        hidden: {opacity: 0, y: 50}
                    }}
                    transition={{duration: 0.5, ease: 'easeOut'}}
                    className="w-full max-w-6xl mb-20"
                >
                    <h2 className={`${rajdhani.className} text-3xl sm:text-4xl font-bold mb-12 text-center bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400`}>
                        Why Choose EternalLink?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                        {features.map((feature, index) => (
                            <FeatureCard key={index} {...feature} />
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="w-full max-w-6xl mb-20 px-4 sm:px-6 lg:px-8"
                >
                    <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center text-white">How It Works</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                        {/* Timeline (Flow Diagram) */}
                        <div className="relative">
                            <div className="absolute left-6 w-1 h-full bg-gradient-to-b from-teal-400 to-blue-500 transform translate-x-1/2"></div>
                            {[
                                {
                                    title: "Create Your EternalLink",
                                    description: "Sign up and generate your unique, memorable identifier combining words and emojis."
                                },
                                {
                                    title: "Connect Securely",
                                    description: "Add friends using their EternalLinks and start messaging with quantum-resistant encryption."
                                },
                                {
                                    title: "Explore AR Messaging",
                                    description: "Leave virtual messages in real-world locations for friends to discover."
                                },
                                {
                                    title: "Leverage AI Assistance",
                                    description: "Get smart suggestions and writing help from our AI-powered assistant."
                                }
                            ].map((step, index) => (
                                <motion.div
                                    key={index}
                                    className="relative mb-20"
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.2, duration: 0.5 }}
                                >
                                    <div className="flex items-start">
                                        <div className="w-10 h-10 bg-teal-400 rounded-full flex items-center justify-center text-white font-semibold shadow-lg absolute -left-14 transform transition-all duration-300 hover:bg-teal-500">
                                            {index + 1}
                                        </div>
                                        <div className="ml-12 pl-4 pr-6 py-3 bg-gray-800/80 rounded-lg shadow-md border-l-4 border-teal-400">
                                            <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                                            <p className="text-gray-300 text-sm">{step.description}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Image */}
                        <div className="flex justify-center mt-10 lg:mt-0 lg:self-center">
                            <Image
                                src="/homepage.jpg"
                                alt="How EternalLink Works"
                                width={500}
                                height={600}
                                className="rounded-lg shadow-lg object-cover"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Testimonials Section */}
                <motion.div {...{ className: '' } as MotionDivProps}
                    initial={{opacity: 0, y: 50}}
                    animate={{opacity: 1, y: 0}}
                    transition={{delay: 1, duration: 0.5}}
                    className="w-full max-w-4xl mb-20"
                >
                    <h2 className={`${rajdhani.className} text-3xl sm:text-4xl font-bold mb-8 text-center`}>What Our Users Say</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <TestimonialCard
                            name="Sudheer"
                            role="Christite"
                            quote="EternalLink's quantum-resistant encryption gives me peace of mind. It's the future of secure communication."
                            image="/images/sudheer.png"
                        />
                        <TestimonialCard
                            name="Sriniketh"
                            role="Christite"
                            quote="The AR messaging feature is a game-changer. I love leaving virtual notes for friends around the world!"
                            image="/images/sriniketh.jpg"
                        />
                        <TestimonialCard
                            name="Elwin Roy"
                            role="Christite"
                            quote="EternalLink's quantum-resistant encryption gives me peace of mind. It's the future of secure communication."
                            image="/images/Elwin.jpg"
                        />
                        <TestimonialCard
                            name="Ashik"
                            role="Christite"
                            quote="EternalLink's quantum-resistant encryption gives me peace of mind. It's the future of secure communication."
                            image="/images/Ashik.jpg"
                        />
                    </div>
                </motion.div>

                {/* Final CTA Section */}
                <motion.div {...{ className: '' } as MotionDivProps}
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 1.2, duration: 0.5}}
                    className="text-center mb-12"
                >
                    <h2 className={`${rajdhani.className} text-3xl sm:text-4xl font-bold mb-4`}>Ready to revolutionize your communication?</h2>
                    <p className={`${robotoMono.className} text-xl mb-8 text-gray-300`}>Join EternalLink today and experience the future of messaging.</p>
                    <Link href="/signup"
                          className="group bg-teal-500 hover:bg-teal-600 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:shadow-teal-500/25 inline-flex items-center text-lg">
                        Get Started Now
                        <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform"/>
                    </Link>
                </motion.div>
            </main>

            {/* Footer - Adjusted z-index */}
            <footer className="w-full bg-gray-900 py-8 border-t border-gradient-to-r from-blue-500/20 to-purple-500/20 z-20">
                <div className="container mx-auto px-6 flex flex-col sm:flex-row justify-between items-center">
                    <p className="text-gray-300 mb-4 sm:mb-0">© 2025 EternalLink. All rights reserved.</p>
                    <div className="flex space-x-6">
                        <Link href="/privacy" className="text-gray-300 hover:text-blue-400 transition duration-300">Privacy Policy</Link>
                        <Link href="/terms" className="text-gray-300 hover:text-blue-400 transition duration-300">Terms of Service</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
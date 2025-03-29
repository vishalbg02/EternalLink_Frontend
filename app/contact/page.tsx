"use client"

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

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

export default function Contact() {
    const [formState, setFormState] = useState({
        name: '',
        email: '',
        message: ''
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        // Here you would typically send the form data to your backend
        console.log('Form submitted:', formState)
        // Reset form after submission
        setFormState({ name: '', email: '', message: '' })
    }

    const handleChange = (e) => {
        setFormState({
            ...formState,
            [e.target.name]: e.target.value
        })
    }

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
                className="w-full max-w-2xl px-4 sm:px-6 lg:px-8 relative z-10"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
            >
                <h1 className={`${rajdhani.className} text-4xl sm:text-5xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400 drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]`}>
                    Contact Us
                </h1>
                <p className={`${robotoMono.className} text-xl mb-8 text-center text-gray-300 tracking-wide leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]`}>
                    Have questions or feedback? We would love to hear from you!
                </p>
                <motion.div
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className={`${robotoMono.className} block text-sm font-medium text-gray-700 dark:text-gray-300`}>
                                Name
                            </label>
                            <Input
                                type="text"
                                id="name"
                                name="name"
                                value={formState.name}
                                onChange={handleChange}
                                required
                                className="mt-1 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className={`${robotoMono.className} block text-sm font-medium text-gray-700 dark:text-gray-300`}>
                                Email
                            </label>
                            <Input
                                type="email"
                                id="email"
                                name="email"
                                value={formState.email}
                                onChange={handleChange}
                                required
                                className="mt-1 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="message" className={`${robotoMono.className} block text-sm font-medium text-gray-700 dark:text-gray-300`}>
                                Message
                            </label>
                            <Textarea
                                id="message"
                                name="message"
                                rows={4}
                                value={formState.message}
                                onChange={handleChange}
                                required
                                className="mt-1 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                            />
                        </div>
                        <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:shadow-teal-500/25 flex items-center justify-center">
                            Send Message <Send className="ml-2 h-4 w-4" />
                        </Button>
                    </form>
                </motion.div>
            </motion.div>
        </div>
    )
}
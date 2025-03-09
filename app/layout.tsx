import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'EternalLink',
    description: 'P2P encrypted messaging system with AR capabilities',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <head>
            <script src="https://aframe.io/releases/1.5.0/aframe.min.js" async></script>
        </head>
        <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
            {children}
        </div>
        <Toaster />
        </body>
        </html>
    )
}
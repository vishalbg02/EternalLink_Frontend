import Link from 'next/link'

export function Footer() {
    return (
        <footer className="w-full bg-gray-900 py-8 border-t border-gradient-to-r from-blue-500/20 to-purple-500/20">
            <div className="container mx-auto px-6 flex flex-col sm:flex-row justify-between items-center">
                <p className="text-gray-300 mb-4 sm:mb-0">&copy; 2024 EternalLink. All rights reserved.</p>
                <div className="flex space-x-6">
                    <Link href="/privacy" className="text-gray-300 hover:text-blue-400 transition duration-300">Privacy Policy</Link>
                    <Link href="/terms" className="text-gray-300 hover:text-blue-400 transition duration-300">Terms of Service</Link>
                </div>
            </div>
        </footer>
    )
}


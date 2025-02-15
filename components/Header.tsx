import Link from 'next/link'

export function Header() {
    return (
        <header className="w-full bg-gray-900/80 backdrop-blur-lg fixed top-0 z-10 border-b border-gray-800">
            <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold text-blue-400 hover:text-blue-300 transition-colors">
                    EternalLink
                </Link>
                <div className="space-x-6">
                    <Link href="/about" className="hover:text-blue-400 transition duration-300">About</Link>
                    <Link href="/features" className="hover:text-blue-400 transition duration-300">Features</Link>
                    <Link href="/contact" className="hover:text-blue-400 transition duration-300">Contact</Link>
                </div>
            </nav>
        </header>
    )
}


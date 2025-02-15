'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export default function BackendConnectionTest() {
    const [isConnected, setIsConnected] = useState<boolean | null>(null)

    useEffect(() => {
        const testConnection = async () => {
            try {
                const response = await fetch('http://localhost:3080/api/test-connection', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })

                if (response.ok) {
                    setIsConnected(true)
                    toast.success('Successfully connected to the backend!')
                } else {
                    setIsConnected(false)
                    toast.error('Failed to connect to the backend.')
                }
            } catch (error) {
                console.error('Error testing backend connection:', error)
                setIsConnected(false)
                toast.error('Error occurred while testing backend connection.')
            }
        }

        testConnection()
    }, [])

    return (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Backend Connection Status</h2>
            {isConnected === null ? (
                <p>Testing connection...</p>
            ) : isConnected ? (
                <p className="text-green-500">Connected to backend</p>
            ) : (
                <p className="text-red-500">Not connected to backend</p>
            )}
        </div>
    )
}


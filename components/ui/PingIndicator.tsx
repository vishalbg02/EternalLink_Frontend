// PingIndicator.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Wifi, WifiOff, AlertCircle } from "lucide-react"

const PingIndicator = () => {
    const [ping, setPing] = useState(0)
    const [isConnected, setIsConnected] = useState(true)
    const [pingHistory, setPingHistory] = useState<number[]>([])
    const [status, setStatus] = useState("stable")

    const calculateJitter = useCallback((history: number[]) => {
        if (history.length < 2) return 0
        const differences = history.slice(1).map((ping, i) => Math.abs(ping - history[i]))
        return differences.reduce((a, b) => a + b, 0) / differences.length
    }, [])

    const getPingColor = (ping: number) => {
        if (ping < 50) return "text-green-400"
        if (ping < 100) return "text-yellow-400"
        if (ping < 150) return "text-orange-400"
        return "text-red-400"
    }

    const getStatusIcon = () => {
        if (!isConnected) return <WifiOff className="w-4 h-4 text-red-400" />
        if (status === "unstable") return <AlertCircle className="w-4 h-4 text-yellow-400" />
        return <Wifi className="w-4 h-4 text-green-400" />
    }

    const getBars = (ping: number) => {
        if (ping < 50) return 1
        if (ping < 100) return 2
        if (ping < 150) return 3
        return 4
    }

    const getStatusMessage = () => {
        if (!isConnected) return "Connection lost"
        if (status === "unstable") return "Network unstable"
        if (status === "poor") return "Poor connection"
        return "Connection stable"
    }

    const updatePing = useCallback(() => {
        const newPing = Math.floor(Math.random() * 180) + 20
        setPing(newPing)
        setIsConnected(newPing < 999)

        setPingHistory((prev) => {
            const newHistory = [...prev, newPing].slice(-30)
            const jitter = calculateJitter(newHistory)
            const avgPing = newHistory.reduce((a, b) => a + b, 0) / newHistory.length

            let newStatus = "stable"
            if (jitter > 50) newStatus = "unstable"
            else if (avgPing > 150) newStatus = "poor"
            setStatus(newStatus)

            return newHistory
        })
    }, [calculateJitter])

    useEffect(() => {
        const interval = setInterval(updatePing, 1000)
        return () => clearInterval(interval)
    }, [updatePing])

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <motion.div
                        className="absolute top-4 left-4 flex items-center space-x-2 bg-gradient-to-r from-gray-900/90 to-black/90 rounded-full px-4 py-2 backdrop-blur-lg hover:bg-gray-800/95 transition-all shadow-lg border border-gray-800/50"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <div className="flex items-center space-x-2">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={status}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center"
                                >
                                    {getStatusIcon()}
                                </motion.div>
                            </AnimatePresence>

                            {isConnected && (
                                <div className="flex items-end h-4 space-x-[2px]">
                                    {[...Array(4)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ height: "0%" }}
                                            animate={{
                                                height: i < getBars(ping) ? ["25%", "50%", "75%", "100%"][i] : "25%",
                                            }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                            className={`w-1 ${i < getBars(ping) ? getPingColor(ping) : "bg-gray-600/50"} rounded-full`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <span className={`text-sm font-semibold ${getPingColor(ping)}`}>{ping} ms</span>
                            <span className="text-xs text-gray-400">
                                {status === "unstable" ? `±${Math.round(calculateJitter(pingHistory))}ms` : ""}
                            </span>
                        </div>
                    </motion.div>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900/95 text-white border-gray-800/50 backdrop-blur-sm">{getStatusMessage()}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export default PingIndicator
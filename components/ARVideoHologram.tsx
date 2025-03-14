"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Video, X, Send, AlertCircle, XCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/utils/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { get, set } from "idb-keyval"
import { preloadMediaPipeHands } from "@/utils/scriptLoader"

interface ARMessage {
    latitude: number
    longitude: number
    altitude: number
    expiresAt: string
    videoIpfsHash?: string
    gestureTrigger?: string
    isViewed?: boolean
}

interface ARVideoHologramProps {
    messageId?: number
    arMessage?: ARMessage
    onVideoUpload: (videoBlob: Blob, gestureTrigger: string) => Promise<void>
    onGestureVerified?: (messageId: number) => void
}

interface HandLandmark {
    x: number
    y: number
    z: number
}

const HAND_CONNECTIONS = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4], // thumb
    [0, 5],
    [5, 6],
    [6, 7],
    [7, 8], // index finger
    [0, 9],
    [9, 10],
    [10, 11],
    [11, 12], // middle finger
    [0, 13],
    [13, 14],
    [14, 15],
    [15, 16], // ring finger
    [0, 17],
    [17, 18],
    [18, 19],
    [19, 20], // pinky
    [0, 5],
    [5, 9],
    [9, 13],
    [13, 17], // palm
]

const gestureOptions = [
    { value: "WAVE", label: "Wave 👋" },
    { value: "CLAP", label: "Clap 👏" },
    { value: "PEACE", label: "Peace ✌️" },
    { value: "THUMBS_UP", label: "Thumbs Up 👍" },
]

const ARVideoHologram = ({ messageId, arMessage, onVideoUpload, onGestureVerified }: ARVideoHologramProps) => {
    const [isRecording, setIsRecording] = useState(false)
    const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null)
    const [selectedGestureTrigger, setSelectedGestureTrigger] = useState<string>("")
    const [isPlaying, setIsPlaying] = useState(false)
    const [gestureDetected, setGestureDetected] = useState<string>("")
    const [cameraError, setCameraError] = useState<string | null>(null)
    const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false)
    const [isSent, setIsSent] = useState(false)
    const [handLandmarks, setHandLandmarks] = useState<HandLandmark[][]>([])
    const [handedness, setHandedness] = useState<string[]>([])
    const [isMediaPipeLoaded, setIsMediaPipeLoaded] = useState(false)
    const [cachedVideoUrl, setCachedVideoUrl] = useState<string | null>(null)
    const [gestureVerified, setGestureVerified] = useState(false)
    const [unityInstance, setUnityInstance] = useState<any>(null)
    const [isUnityLoaded, setIsUnityLoaded] = useState(false)
    const [isUnityLoading, setIsUnityLoading] = useState(false)
    const [unityLoadAttempts, setUnityLoadAttempts] = useState(0)
    const [unityDebugInfo, setUnityDebugInfo] = useState<string[]>([])

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const livePreviewRef = useRef<HTMLVideoElement>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const handsRef = useRef<any>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const frameRequestRef = useRef<number | null>(null)
    const unityContainerRef = useRef<HTMLDivElement>(null)
    const unityCanvasRef = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
        preloadMediaPipeHands()
            .then(() => setIsMediaPipeLoaded(true))
            .catch((error) => {
                console.error("Failed to preload MediaPipe Hands:", error)
                setCameraError("Failed to load hand detection scripts.")
            })

        // Define global callback for Unity
        window.onUnityARVideoReady = () => {
            console.log("Unity is ready to receive video URLs")
            setIsUnityLoaded(true)
        }

        // Define global error handler for Unity
        window.onUnityError = (errorMessage: string) => {
            console.error("Unity error:", errorMessage)
            setUnityDebugInfo((prev) => [...prev, `Error: ${errorMessage}`])
            toast.error(`Unity error: ${errorMessage}`)
        }

        return () => {
            stopStream()
            if (cachedVideoUrl) URL.revokeObjectURL(cachedVideoUrl)
            cleanupUnity()
        }
    }, [])

    const drawHandLandmarks = useCallback(() => {
        if (!canvasRef.current || !videoRef.current || handLandmarks.length === 0) return

        const ctx = canvasRef.current.getContext("2d")
        if (!ctx) return

        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

        handLandmarks.forEach((landmarks, handIndex) => {
            const isRightHand = handedness[handIndex]?.toLowerCase() === "right"
            const connectionColor = isRightHand ? "rgba(0, 255, 0, 0.8)" : "rgba(255, 0, 0, 0.8)"
            const landmarkColor = isRightHand ? "rgba(0, 255, 0, 1.0)" : "rgba(255, 0, 0, 1.0)"

            ctx.strokeStyle = connectionColor
            ctx.lineWidth = 3
            HAND_CONNECTIONS.forEach(([start, end]) => {
                if (landmarks[start] && landmarks[end]) {
                    ctx.beginPath()
                    ctx.moveTo(landmarks[start].x * canvasRef.current!.width, landmarks[start].y * canvasRef.current!.height)
                    ctx.lineTo(landmarks[end].x * canvasRef.current!.width, landmarks[end].y * canvasRef.current!.height)
                    ctx.stroke()
                }
            })

            ctx.fillStyle = landmarkColor
            landmarks.forEach((landmark) => {
                ctx.beginPath()
                ctx.arc(landmark.x * canvasRef.current!.width, landmark.y * canvasRef.current!.height, 5, 0, 2 * Math.PI)
                ctx.fill()
            })
        })

        if (gestureDetected) {
            ctx.font = "bold 24px Arial"
            ctx.fillStyle = "white"
            ctx.strokeStyle = "black"
            ctx.lineWidth = 2
            const text = `Detected: ${gestureDetected}`
            const textWidth = ctx.measureText(text).width
            const x = (canvasRef.current.width - textWidth) / 2
            const y = 40
            ctx.strokeText(text, x, y)
            ctx.fillText(text, x, y)
        }
    }, [handLandmarks, handedness, gestureDetected])

    useEffect(() => {
        drawHandLandmarks()
    }, [handLandmarks, drawHandLandmarks])

    const initializeCameraAndHands = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "environment" },
                audio: true,
            })
            streamRef.current = stream

            if (!isMediaPipeLoaded) throw new Error("MediaPipe Hands not yet loaded")

            const Hands = (window as any).Hands
            if (!Hands) throw new Error("MediaPipe Hands not available")

            handsRef.current = new Hands({
                locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`,
            })

            handsRef.current.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.6,
                minTrackingConfidence: 0.6,
            })

            handsRef.current.onResults((results: any) => {
                if (results.multiHandLandmarks && results.multiHandedness) {
                    setHandLandmarks(results.multiHandLandmarks)
                    setHandedness(results.multiHandedness.map((info: any) => info.label))
                    const gesture = detectGesture(results)
                    setGestureDetected(gesture)
                } else {
                    setHandLandmarks([])
                    setHandedness([])
                    setGestureDetected("")
                }
            })

            const sendFrames = async () => {
                if (videoRef.current && handsRef.current && videoRef.current.readyState >= 2) {
                    await handsRef.current
                        .send({ image: videoRef.current })
                        .catch((error: any) => console.error("Error sending frame:", error))
                }
                frameRequestRef.current = requestAnimationFrame(sendFrames)
            }

            if (videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play()
                    sendFrames()
                }
            }

            setCameraError(null)
        } catch (err) {
            setCameraError("Failed to initialize camera or hand detection.")
            stopStream()
            console.error("Camera/Hands initialization error:", err)
            throw err
        }
    }, [isMediaPipeLoaded])

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
                track.stop()
                track.enabled = false
            })
            streamRef.current = null
        }
        if (videoRef.current) videoRef.current.srcObject = null
        if (livePreviewRef.current) livePreviewRef.current.srcObject = null
        if (handsRef.current) {
            handsRef.current.close().catch((err: any) => console.error("Error closing hands:", err))
            handsRef.current = null
        }
        if (frameRequestRef.current) {
            cancelAnimationFrame(frameRequestRef.current)
            frameRequestRef.current = null
        }
        setHandLandmarks([])
        setHandedness([])
        setGestureDetected("")
    }, [])

    const detectGesture = useCallback((results: any): string => {
        if (!results.multiHandLandmarks?.[0]) return ""
        const landmarks = results.multiHandLandmarks[0]

        const thumbTip = landmarks[4]
        const indexTip = landmarks[8]
        const middleTip = landmarks[12]
        const ringTip = landmarks[16]
        const pinkyTip = landmarks[20]
        const wrist = landmarks[0]

        const distance = (p1: HandLandmark, p2: HandLandmark) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)

        if (
            distance(indexTip, wrist) > 0.2 &&
            distance(middleTip, wrist) > 0.2 &&
            distance(ringTip, wrist) < 0.15 &&
            distance(pinkyTip, wrist) < 0.15
        )
            return "PEACE"

        if (
            thumbTip.y < wrist.y - 0.1 &&
            indexTip.y > wrist.y &&
            middleTip.y > wrist.y &&
            ringTip.y > wrist.y &&
            pinkyTip.y > wrist.y
        )
            return "THUMBS_UP"

        if (
            distance(indexTip, wrist) > 0.2 &&
            distance(middleTip, wrist) > 0.2 &&
            distance(ringTip, wrist) > 0.2 &&
            distance(pinkyTip, wrist) > 0.2
        )
            return "WAVE"

        if (results.multiHandLandmarks.length >= 2) {
            const hand1Center = {
                x: landmarks.reduce((sum: number, lm: any) => sum + lm.x, 0) / landmarks.length,
                y: landmarks.reduce((sum: number, lm: any) => sum + lm.y, 0) / landmarks.length,
            }
            const hand2Center = {
                x: results.multiHandLandmarks[1].reduce((sum: number, lm: any) => sum + lm.x, 0) / 21,
                y: results.multiHandLandmarks[1].reduce((sum: number, lm: any) => sum + lm.y, 0) / 21,
            }
            if (distance(hand1Center, hand2Center) < 0.1) return "CLAP"
        }

        return ""
    }, [])

    const startRecording = useCallback(async () => {
        if (isRecording) return

        try {
            stopStream()
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
                audio: true,
            })
            streamRef.current = stream

            if (livePreviewRef.current) {
                livePreviewRef.current.srcObject = stream
                livePreviewRef.current.onloadedmetadata = () => {
                    livePreviewRef.current?.play().catch((error) => console.error("Error playing preview:", error))
                }
            }

            // Use a widely supported codec with fallback
            let mimeType = "video/webm; codecs=vp9"
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = "video/webm"
            }

            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType })
            const chunks: Blob[] = []

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data)
            }
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType })
                setRecordedVideoBlob(blob)
                stopStream()
            }
            mediaRecorderRef.current.onerror = (err) => {
                console.error("MediaRecorder error:", err)
                toast.error("Recording failed due to an error.")
                stopStream()
            }

            mediaRecorderRef.current.start(1000)
            setIsRecording(true)
            setCameraError(null)
        } catch (error) {
            console.error("Start recording failed:", error)
            toast.error((error as Error).message || "Failed to start recording.")
            stopStream()
        }
    }, [stopStream])

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop()
            mediaRecorderRef.current = null
        }
        setIsRecording(false)
    }, [])

    const handleUpload = useCallback(async () => {
        if (!recordedVideoBlob || !selectedGestureTrigger) {
            toast.error("Record a video and select a gesture trigger first.")
            return
        }
        try {
            await onVideoUpload(recordedVideoBlob, selectedGestureTrigger)
            setIsSent(true)
            setRecordedVideoBlob(null)
            setSelectedGestureTrigger("")
            toast.success("AR Message Sent!")
        } catch (error) {
            console.error("Upload failed:", error)
            toast.error("Failed to upload AR video")
        }
    }, [recordedVideoBlob, selectedGestureTrigger, onVideoUpload])

    const loadCachedVideo = useCallback(async () => {
        if (!arMessage?.videoIpfsHash) {
            console.error("No videoIpfsHash provided")
            return null
        }

        const cacheKey = `ar-video-${arMessage.videoIpfsHash}`
        try {
            const cachedBlob = await get(cacheKey)

            if (cachedBlob) {
                const url = URL.createObjectURL(cachedBlob)
                setCachedVideoUrl(url)
                return url
            }

            const response = await apiRequest(`/files/download/${arMessage.videoIpfsHash}`, "GET", null, false, "blob")
            if (!response?.blob) throw new Error("Failed to fetch video")

            const blob = response.blob
            await set(cacheKey, blob)
            const url = URL.createObjectURL(blob)
            setCachedVideoUrl(url)
            return url
        } catch (error) {
            console.error("Error loading cached video:", error)
            toast.error("Failed to load video")
            return null
        }
    }, [arMessage?.videoIpfsHash])

    // Simplified WebGL context patching
    const patchWebGLContext = useCallback(() => {
        // Store original methods
        const originalGetContext = HTMLCanvasElement.prototype.getContext

        // Patch HTMLCanvasElement.prototype.getContext with safer defaults
        HTMLCanvasElement.prototype.getContext = function (contextType, contextAttributes) {
            console.log(`Canvas getContext called with type: ${contextType}`)

            // Apply safe defaults for WebGL contexts
            if (contextType === "webgl" || contextType === "webgl2" || contextType === "experimental-webgl") {
                contextAttributes = {
                    alpha: true,
                    antialias: true,
                    depth: true,
                    premultipliedAlpha: true,
                    preserveDrawingBuffer: true,
                    stencil: true,
                    ...contextAttributes,
                }
            }

            return originalGetContext.call(this, contextType, contextAttributes)
        }

        console.log("WebGL context patched successfully")
    }, [])

    const loadUnity = useCallback(async () => {
        if (unityInstance || isUnityLoaded || isUnityLoading || !unityContainerRef.current) return

        setIsUnityLoading(true)
        setUnityDebugInfo((prev) => [...prev, "Starting Unity load process"])

        try {
            // Clear the container first
            if (unityContainerRef.current) {
                unityContainerRef.current.innerHTML = ""
                setUnityDebugInfo((prev) => [...prev, "Cleared Unity container"])
            }

            // Create a canvas element manually with explicit dimensions
            const canvas = document.createElement("canvas")
            canvas.id = "unity-canvas"
            canvas.width = 640
            canvas.height = 480
            canvas.style.width = "100%"
            canvas.style.height = "100%"
            canvas.style.background = "#000"
            unityCanvasRef.current = canvas

            // Add the canvas to the container
            unityContainerRef.current.appendChild(canvas)
            setUnityDebugInfo((prev) => [...prev, "Created and added canvas to container"])

            // Apply WebGL context patch before loading Unity
            patchWebGLContext()
            setUnityDebugInfo((prev) => [...prev, "Applied WebGL context patch"])

            // Create a new script element for Unity loader
            const script = document.createElement("script")
            script.src = "/unity-build/Unity_.loader.js"
            script.async = true

            // Apply the patch again after the script loads but before Unity initializes
            script.onload = () => {
                setUnityDebugInfo((prev) => [...prev, "Unity loader script loaded"])

                // Apply patch again to ensure it's in place
                patchWebGLContext()

                const createUnityInstance = (window as any).createUnityInstance
                if (!createUnityInstance) {
                    throw new Error("Unity createUnityInstance not found")
                }

                // Create Unity instance with the canvas we created
                createUnityInstance(canvas, {
                    dataUrl: "/unity-build/Unity_.data.br",
                    frameworkUrl: "/unity-build/Unity_.framework.js.br",
                    codeUrl: "/unity-build/Unity_.wasm.br",
                    companyName: "YourCompany",
                    productName: "ARVideoPlayer",
                    productVersion: "1.0",
                    // Use minimal WebGL context attributes
                    webglContextAttributes: {
                        alpha: true,
                        depth: true,
                        stencil: true,
                        antialias: true,
                        premultipliedAlpha: true,
                        preserveDrawingBuffer: true,
                    },
                })
                    .then((instance: any) => {
                        setUnityInstance(instance)
                        setIsUnityLoaded(true)
                        setIsUnityLoading(false)
                        setUnityDebugInfo((prev) => [...prev, "Unity instance created successfully"])
                        console.log("Unity instance created successfully")
                        toast.dismiss("unity-loading")
                        toast.success("Unity loaded successfully!")
                    })
                    .catch((error: any) => {
                        console.error("Error creating Unity instance:", error)
                        setUnityDebugInfo((prev) => [...prev, `Error creating Unity instance: ${error.message}`])
                        toast.error("Failed to load Unity environment: " + error.message)
                        setIsUnityLoading(false)

                        // Increment load attempts counter
                        setUnityLoadAttempts((prev) => prev + 1)
                    })
            }

            script.onerror = (error) => {
                console.error("Failed to load Unity loader script", error)
                setUnityDebugInfo((prev) => [...prev, "Failed to load Unity loader script"])
                toast.error("Failed to load Unity resources")
                setIsUnityLoading(false)

                // Increment load attempts counter
                setUnityLoadAttempts((prev) => prev + 1)
            }

            document.body.appendChild(script)
        } catch (error) {
            console.error("Unity loading failed:", error)
            setUnityDebugInfo((prev) => [...prev, `Unity loading failed: ${(error as Error).message}`])
            toast.error("Failed to initialize Unity environment")
            setIsUnityLoading(false)

            // Increment load attempts counter
            setUnityLoadAttempts((prev) => prev + 1)
        }
    }, [unityInstance, isUnityLoaded, isUnityLoading, patchWebGLContext, unityLoadAttempts])

    const cleanupUnity = useCallback(() => {
        if (unityInstance) {
            try {
                unityInstance
                    .Quit()
                    .then(() => {
                        console.log("Unity instance cleaned up")
                        setUnityInstance(null)
                        setIsUnityLoaded(false)
                        if (unityContainerRef.current) {
                            unityContainerRef.current.innerHTML = ""
                        }
                        unityCanvasRef.current = null
                    })
                    .catch((err: any) => console.error("Error quitting Unity:", err))
            } catch (error) {
                console.error("Error during Unity cleanup:", error)
                setUnityInstance(null)
                setIsUnityLoaded(false)
                unityCanvasRef.current = null
            }
        }
    }, [unityInstance])

    // Fallback video player for when Unity fails
    const startFallbackVideoPlayer = useCallback(async () => {
        const videoUrl = await loadCachedVideo()
        if (!videoUrl) {
            toast.error("Failed to load video URL")
            return
        }

        if (unityContainerRef.current) {
            // Clear the container
            unityContainerRef.current.innerHTML = ""

            // Create a video element
            const videoElement = document.createElement("video")
            videoElement.src = videoUrl
            videoElement.controls = true
            videoElement.autoplay = true
            videoElement.style.width = "100%"
            videoElement.style.height = "100%"
            videoElement.style.objectFit = "contain"

            // Add the video to the container
            unityContainerRef.current.appendChild(videoElement)
            setIsPlaying(true)
            toast.success("Video started in fallback player")
        }
    }, [loadCachedVideo])

    const startUnityAR = useCallback(async () => {
        if (!isUnityLoaded && !isUnityLoading) {
            // Try to load Unity if not already loaded or loading
            loadUnity()
            toast.loading("Loading Unity environment...", { id: "unity-loading" })
            return
        }

        if (!unityInstance && !isUnityLoading) {
            // If Unity failed to load after multiple attempts, use fallback
            if (unityLoadAttempts >= 2) {
                toast.error("Unity failed to load. Using fallback video player.")
                startFallbackVideoPlayer()
                return
            }

            // Otherwise try loading Unity again
            loadUnity()
            toast.loading("Retrying Unity load...", { id: "unity-loading" })
            return
        }

        if (!unityInstance && isUnityLoading) {
            toast.error("Unity is still loading. Please wait.")
            return
        }

        const videoUrl = await loadCachedVideo()
        if (!videoUrl) {
            toast.error("Failed to load video URL")
            return
        }

        try {
            // Make Unity container visible
            if (unityContainerRef.current) {
                unityContainerRef.current.style.display = "block"
            }

            // Send the video URL to Unity
            unityInstance.SendMessage("ARVideoPlayer", "StartARVideoDisplay", videoUrl)
            setIsPlaying(true)
            toast.success("AR/VR video started!")
        } catch (error) {
            console.error("Error starting Unity AR:", error)
            setUnityDebugInfo((prev) => [...prev, `Error starting Unity AR: ${(error as Error).message}`])
            toast.error("Failed to start AR/VR video. Using fallback player.")
            startFallbackVideoPlayer()
        }
    }, [
        unityInstance,
        isUnityLoaded,
        isUnityLoading,
        loadCachedVideo,
        loadUnity,
        unityLoadAttempts,
        startFallbackVideoPlayer,
    ])

    const stopUnityAR = useCallback(() => {
        if (unityInstance) {
            try {
                unityInstance.SendMessage("ARVideoPlayer", "ResetVideoPlacement")
                setIsPlaying(false)
                toast.success("AR/VR video stopped!")
            } catch (error) {
                console.error("Error stopping Unity AR:", error)
                toast.error("Failed to stop AR/VR video")
            }
        } else {
            // Handle fallback video player
            if (unityContainerRef.current) {
                unityContainerRef.current.innerHTML = ""
                setIsPlaying(false)
                toast.success("Video stopped!")
            }
        }
    }, [unityInstance])

    const handleGestureDetected = useCallback(async () => {
        if (!messageId || !arMessage?.videoIpfsHash || !arMessage.gestureTrigger || isPlaying || gestureVerified) return

        if (gestureDetected !== arMessage.gestureTrigger) return

        try {
            const response = await apiRequest(`/ar-messages/view/${messageId}?gesturePerformed=${gestureDetected}`, "POST")
            setGestureVerified(true)
            stopStream()
            setIsCameraDialogOpen(false)

            if (response.success && onGestureVerified) {
                onGestureVerified(messageId)
            }

            toast.success("Gesture verified! Click 'View in AR/VR' to start Unity.")
        } catch (error) {
            console.error("Gesture verification failed:", error)
            toast.error("Failed to verify gesture")
        }
    }, [messageId, arMessage, gestureDetected, isPlaying, gestureVerified, stopStream, onGestureVerified])

    const openCameraPopup = useCallback(async () => {
        setIsCameraDialogOpen(true)
        try {
            await initializeCameraAndHands()
        } catch {
            setIsCameraDialogOpen(false)
        }
    }, [initializeCameraAndHands])

    useEffect(() => {
        if (gestureDetected && arMessage?.gestureTrigger === gestureDetected) {
            handleGestureDetected()
        }
    }, [gestureDetected, arMessage, handleGestureDetected])

    return (
        <div className="space-y-4">
            <div
                ref={unityContainerRef}
                id="unityContainer"
                className={`w-full h-[50vh] bg-black rounded-lg overflow-hidden ${isPlaying ? "block" : "hidden"}`}
            />

            {cameraError && (
                <div className="flex items-center bg-red-100 p-2 rounded-lg mb-2">
                    <AlertCircle className="mr-2 text-red-500" />
                    <span className="text-red-700">{cameraError}</span>
                </div>
            )}

            {!messageId ? (
                isSent ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-purple-400 text-sm font-medium"
                    >
                        AR Message Sent
                    </motion.div>
                ) : (
                    <div className="space-y-2">
                        {isRecording && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full aspect-video bg-black rounded-lg overflow-hidden relative"
                            >
                                <video ref={livePreviewRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                                <span className="absolute top-2 left-2 text-xs text-red-400 bg-gray-900/80 px-1 rounded">
                  Recording
                </span>
                            </motion.div>
                        )}

                        <Button
                            onClick={isRecording ? stopRecording : startRecording}
                            variant={isRecording ? "destructive" : "default"}
                            className="w-full justify-start"
                        >
                            <Video className="w-4 h-4 mr-2" />
                            {isRecording ? "Stop Recording" : "Start Recording"}
                        </Button>

                        {recordedVideoBlob && (
                            <div className="space-y-2">
                                <Select value={selectedGestureTrigger} onValueChange={setSelectedGestureTrigger}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Gesture Trigger" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {gestureOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"
                                >
                                    <Video className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm text-gray-700">AR Video Recorded</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setRecordedVideoBlob(null)
                                            setSelectedGestureTrigger("")
                                        }}
                                        className="text-red-500 hover:text-red-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleUpload}
                                        disabled={!selectedGestureTrigger}
                                        className="text-green-500 hover:text-green-600 disabled:text-gray-400"
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </motion.div>
                            </div>
                        )}
                    </div>
                )
            ) : (
                arMessage?.videoIpfsHash && (
                    <div className="mt-3">
                        {!arMessage.isViewed && !gestureVerified ? (
                            <div className="flex flex-col items-start space-y-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        openCameraPopup()
                                    }}
                                    className="text-purple-600 hover:text-purple-700"
                                >
                                    <Video className="w-4 h-4 mr-2" />
                                    Reveal AR Video ({arMessage.gestureTrigger})
                                </Button>
                                <span className="text-xs text-gray-500">Perform {arMessage.gestureTrigger} gesture to view</span>
                            </div>
                        ) : gestureVerified && !isPlaying ? (
                            <div className="flex flex-col items-start space-y-2">
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        startUnityAR()
                                    }}
                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                    disabled={isUnityLoading}
                                >
                                    <Video className="w-4 h-4 mr-2" />
                                    View in AR/VR {isUnityLoading && "(Loading...)"}
                                </Button>
                                <span className="text-xs text-gray-500">
                  {isUnityLoaded
                      ? "Gesture verified, click to start Unity AR/VR experience"
                      : isUnityLoading
                          ? "Loading Unity environment, please wait..."
                          : "Click to load Unity AR/VR experience"}
                </span>
                            </div>
                        ) : isPlaying ? (
                            <div className="relative">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        stopUnityAR()
                                    }}
                                    className="absolute top-2 right-2 text-white z-10"
                                >
                                    <XCircle className="w-6 h-6" />
                                </Button>
                            </div>
                        ) : (
                            <span className="text-sm text-gray-500">AR Video Viewed</span>
                        )}

                        <Dialog
                            open={isCameraDialogOpen}
                            onOpenChange={(open) => {
                                if (!open) {
                                    stopStream()
                                    setIsCameraDialogOpen(false)
                                }
                            }}
                        >
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center">
                                        <Video className="w-4 h-4 mr-2 text-purple-600" />
                                        Perform {arMessage?.gestureTrigger} Gesture
                                    </DialogTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsCameraDialogOpen(false)}
                                        className="absolute right-4 top-4"
                                    >
                                        <XCircle className="h-4 w-4" />
                                    </Button>
                                </DialogHeader>

                                <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                                    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2">
                                        <div className="flex justify-between items-center">
                      <span>
                        Detected: <span className="font-bold">{gestureDetected || "None"}</span>
                      </span>
                                            <span
                                                className={gestureDetected === arMessage?.gestureTrigger ? "text-green-400" : "text-gray-300"}
                                            >
                        {gestureDetected === arMessage?.gestureTrigger
                            ? "✓ Correct gesture!"
                            : `Waiting for ${arMessage?.gestureTrigger}`}
                      </span>
                                        </div>
                                    </div>
                                    {!isMediaPipeLoaded && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                                            <div className="text-white text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto mb-2"></div>
                                                <p>Loading hand detection...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-2 text-sm text-gray-600">
                                    <h3 className="font-medium mb-1">Gesture Instructions:</h3>
                                    <ul className="space-y-1 list-disc pl-5">
                                        {arMessage?.gestureTrigger === "PEACE" && <li>Hold up index and middle fingers in a V shape</li>}
                                        {arMessage?.gestureTrigger === "THUMBS_UP" && <li>Make a fist with thumb pointing upward</li>}
                                        {arMessage?.gestureTrigger === "WAVE" && <li>Hold hand open and move side to side</li>}
                                        {arMessage?.gestureTrigger === "CLAP" && <li>Bring both hands together</li>}
                                        <li>Ensure hand is visible and steady</li>
                                    </ul>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )
            )}

            {/* Debug panel - only shown during development */}
            {process.env.NODE_ENV === "development" && unityDebugInfo.length > 0 && (
                <div className="mt-4 p-2 bg-gray-100 rounded-md text-xs">
                    <h4 className="font-bold mb-1">Unity Debug Info:</h4>
                    <ul className="space-y-1">
                        {unityDebugInfo.map((info, index) => (
                            <li key={index}>{info}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

export default ARVideoHologram









"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Video, X, Send, AlertCircle, XCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { apiRequest } from "@/utils/api";
import { loadAFrame } from "@/utils/aframe-loader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { get, set } from "idb-keyval"; // For caching videos
import { preloadMediaPipeHands } from "@/utils/scriptLoader"; // Import the utility

interface ARMessage {
    latitude: number;
    longitude: number;
    altitude: number;
    expiresAt: string;
    videoIpfsHash?: string;
    gestureTrigger?: string;
    isViewed?: boolean;
}

interface ARVideoHologramProps {
    messageId?: number;
    arMessage?: ARMessage;
    onVideoUpload: (videoBlob: Blob, gestureTrigger: string) => Promise<void>;
}

interface HandLandmark {
    x: number;
    y: number;
    z: number;
}

const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],         // thumb
    [0, 5], [5, 6], [6, 7], [7, 8],         // index finger
    [0, 9], [9, 10], [10, 11], [11, 12],    // middle finger
    [0, 13], [13, 14], [14, 15], [15, 16],  // ring finger
    [0, 17], [17, 18], [18, 19], [19, 20],  // pinky
    [0, 5], [5, 9], [9, 13], [13, 17],      // palm
];

const gestureOptions = [
    { value: "WAVE", label: "Wave 👋" },
    { value: "CLAP", label: "Clap 👏" },
    { value: "PEACE", label: "Peace ✌️" },
    { value: "THUMBS_UP", label: "Thumbs Up 👍" },
];

const ARVideoHologram = ({ messageId, arMessage, onVideoUpload }: ARVideoHologramProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
    const [selectedGestureTrigger, setSelectedGestureTrigger] = useState<string>("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [gestureDetected, setGestureDetected] = useState<string>("");
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [handLandmarks, setHandLandmarks] = useState<HandLandmark[][]>([]);
    const [handedness, setHandedness] = useState<string[]>([]);
    const [isMediaPipeLoaded, setIsMediaPipeLoaded] = useState(false);
    const [cachedVideoUrl, setCachedVideoUrl] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const livePreviewRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const handsRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const frameRequestRef = useRef<number | null>(null);

    // Load MediaPipe Hands scripts once on component mount
    useEffect(() => {
        preloadMediaPipeHands()
            .then(() => setIsMediaPipeLoaded(true))
            .catch((error) => {
                console.error("Failed to preload MediaPipe Hands:", error);
                setCameraError("Failed to load hand detection scripts.");
            });
    }, []);

    const drawHandLandmarks = useCallback(() => {
        if (!canvasRef.current || !videoRef.current || handLandmarks.length === 0) return;

        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;

        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        handLandmarks.forEach((landmarks, handIndex) => {
            const isRightHand = handedness[handIndex]?.toLowerCase() === "right";
            const connectionColor = isRightHand ? "rgba(0, 255, 0, 0.8)" : "rgba(255, 0, 0, 0.8)";
            const landmarkColor = isRightHand ? "rgba(0, 255, 0, 1.0)" : "rgba(255, 0, 0, 1.0)";

            ctx.strokeStyle = connectionColor;
            ctx.lineWidth = 3;
            HAND_CONNECTIONS.forEach(([start, end]) => {
                if (landmarks[start] && landmarks[end]) {
                    ctx.beginPath();
                    ctx.moveTo(landmarks[start].x * canvasRef.current!.width, landmarks[start].y * canvasRef.current!.height);
                    ctx.lineTo(landmarks[end].x * canvasRef.current!.width, landmarks[end].y * canvasRef.current!.height);
                    ctx.stroke();
                }
            });

            ctx.fillStyle = landmarkColor;
            landmarks.forEach((landmark) => {
                ctx.beginPath();
                ctx.arc(landmark.x * canvasRef.current!.width, landmark.y * canvasRef.current!.height, 5, 0, 2 * Math.PI);
                ctx.fill();
            });
        });

        if (gestureDetected) {
            ctx.font = "bold 24px Arial";
            ctx.fillStyle = "white";
            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
            const text = `Detected: ${gestureDetected}`;
            const textWidth = ctx.measureText(text).width;
            const x = (canvasRef.current.width - textWidth) / 2;
            const y = 40;
            ctx.strokeText(text, x, y);
            ctx.fillText(text, x, y);
        }
    }, [handLandmarks, handedness, gestureDetected]);

    useEffect(() => {
        drawHandLandmarks();
    }, [handLandmarks, drawHandLandmarks]);

    useEffect(() => {
        if ((isRecording || isCameraDialogOpen) && streamRef.current) {
            const targetRef = isRecording ? livePreviewRef : videoRef;
            if (targetRef.current) {
                targetRef.current.srcObject = streamRef.current;
                targetRef.current.onloadedmetadata = () =>
                    targetRef.current?.play().catch((error) => console.error("Error playing video:", error));
            }
        }
    }, [isRecording, isCameraDialogOpen]);

    useEffect(() => {
        return () => stopStream();
    }, []);

    const initializeCameraAndHands = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "environment" },
                audio: true,
            });
            streamRef.current = stream;

            if (!isMediaPipeLoaded) {
                throw new Error("MediaPipe Hands not yet loaded");
            }

            // @ts-ignore
            const Hands = window.Hands;
            if (!Hands) throw new Error("MediaPipe Hands not available");

            handsRef.current = new Hands({
                locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`,
            });

            handsRef.current.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.6,
                minTrackingConfidence: 0.6,
            });

            handsRef.current.onResults((results: any) => {
                if (results.multiHandLandmarks && results.multiHandedness) {
                    setHandLandmarks(results.multiHandLandmarks);
                    setHandedness(results.multiHandedness.map((info: any) => info.label));
                    const gesture = detectGesture(results);
                    setGestureDetected(gesture);
                } else {
                    setHandLandmarks([]);
                    setHandedness([]);
                    setGestureDetected("");
                }
            });

            const sendFrames = async () => {
                if (videoRef.current && handsRef.current && videoRef.current.readyState >= 2) {
                    await handsRef.current.send({ image: videoRef.current }).catch((error: any) =>
                        console.error("Error sending frame:", error)
                    );
                }
                frameRequestRef.current = requestAnimationFrame(sendFrames);
            };

            if (!isRecording && videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    sendFrames();
                };
            }

            setCameraError(null);
        } catch (err) {
            setCameraError("Failed to initialize camera or hand detection. Check permissions.");
            stopStream();
            throw err;
        }
    }, [isRecording, isMediaPipeLoaded]);

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;
        if (livePreviewRef.current) livePreviewRef.current.srcObject = null;
        if (handsRef.current) {
            handsRef.current.close().catch(() => {});
            handsRef.current = null;
        }
        if (frameRequestRef.current) {
            cancelAnimationFrame(frameRequestRef.current);
            frameRequestRef.current = null;
        }
        setHandLandmarks([]);
        setHandedness([]);
        setGestureDetected("");
    }, []);

    const detectGesture = useCallback((results: any): string => {
        if (!results.multiHandLandmarks?.[0]) return "";
        const landmarks = results.multiHandLandmarks[0];

        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];
        const wrist = landmarks[0];

        const distance = (p1: HandLandmark, p2: HandLandmark) =>
            Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);

        if (
            distance(indexTip, wrist) > 0.2 &&
            distance(middleTip, wrist) > 0.2 &&
            distance(ringTip, wrist) < 0.15 &&
            distance(pinkyTip, wrist) < 0.15
        ) return "PEACE";

        if (
            thumbTip.y < wrist.y - 0.1 &&
            indexTip.y > wrist.y &&
            middleTip.y > wrist.y &&
            ringTip.y > wrist.y &&
            pinkyTip.y > wrist.y
        ) return "THUMBS_UP";

        if (
            distance(indexTip, wrist) > 0.2 &&
            distance(middleTip, wrist) > 0.2 &&
            distance(ringTip, wrist) > 0.2 &&
            distance(pinkyTip, wrist) > 0.2
        ) return "WAVE";

        if (results.multiHandLandmarks.length >= 2) {
            const hand1Center = {
                x: landmarks.reduce((sum: number, lm: any) => sum + lm.x, 0) / landmarks.length,
                y: landmarks.reduce((sum: number, lm: any) => sum + lm.y, 0) / landmarks.length,
            };
            const hand2Center = {
                x: results.multiHandLandmarks[1].reduce((sum: number, lm: any) => sum + lm.x, 0) / 21,
                y: results.multiHandLandmarks[1].reduce((sum: number, lm: any) => sum + lm.y, 0) / 21,
            };
            if (distance(hand1Center, hand2Center) < 0.1) return "CLAP";
        }

        return "";
    }, []);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
                audio: true,
            });
            streamRef.current = stream;
            console.log("Stream obtained:", stream);

            mediaRecorderRef.current = new MediaRecorder(stream);
            const chunks: Blob[] = [];
            mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorderRef.current.onstop = () => setRecordedVideoBlob(new Blob(chunks, { type: "video/webm" }));
            mediaRecorderRef.current.onerror = (err) => console.error("MediaRecorder error:", err);
            mediaRecorderRef.current.start();
            console.log("Recording started");

            setIsRecording(true);
            if (livePreviewRef.current) {
                livePreviewRef.current.srcObject = stream;
                livePreviewRef.current.play();
            }
        } catch (error) {
            console.error("Start recording failed:", error);
            toast.error(error.message || "Failed to start recording");
            stopStream();
        }
    }, [stopStream]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        stopStream();
    }, [stopStream]);

    const handleUpload = useCallback(async () => {
        if (!recordedVideoBlob || !selectedGestureTrigger) {
            toast.error("Record a video and select a gesture trigger first.");
            return;
        }
        try {
            await onVideoUpload(recordedVideoBlob, selectedGestureTrigger);
            setIsSent(true);
            setRecordedVideoBlob(null);
            setSelectedGestureTrigger("");
            toast.success("AR Message Sent!");
        } catch (error) {
            toast.error("Failed to upload AR video");
        }
    }, [recordedVideoBlob, selectedGestureTrigger, onVideoUpload]);

    const loadCachedVideo = useCallback(async () => {
        if (!arMessage?.videoIpfsHash) return;

        const cacheKey = `ar-video-${arMessage.videoIpfsHash}`;
        const cachedBlob = await get(cacheKey);

        if (cachedBlob) {
            const url = URL.createObjectURL(cachedBlob);
            setCachedVideoUrl(url);
            return url;
        }

        const response = await fetch(`/api/files/download/${arMessage.videoIpfsHash}`);
        if (!response.ok) throw new Error("Failed to fetch video");
        const blob = await response.blob();
        await set(cacheKey, blob);
        const url = URL.createObjectURL(blob);
        setCachedVideoUrl(url);
        return url;
    }, [arMessage?.videoIpfsHash]);

    const handleGestureDetected = useCallback(async () => {
        if (!messageId || !arMessage?.videoIpfsHash || !arMessage.gestureTrigger || isPlaying) return;

        if (gestureDetected !== arMessage.gestureTrigger) return;

        try {
            // Modified API request to use query parameters instead of request body
            await apiRequest(`/ar-messages/view/${messageId}?gesturePerformed=${gestureDetected}`, "POST");
            const videoUrl = await loadCachedVideo();
            if (videoUrl) {
                setIsPlaying(true);
                stopStream();
                setIsCameraDialogOpen(false);
            }
        } catch (error) {
            toast.error("Failed to play AR video");
        }
    }, [messageId, arMessage, gestureDetected, isPlaying, loadCachedVideo, stopStream]);

    const openCameraPopup = useCallback(async () => {
        setIsCameraDialogOpen(true);
        try {
            await initializeCameraAndHands();
        } catch {
            setIsCameraDialogOpen(false);
        }
    }, [initializeCameraAndHands]);

    useEffect(() => {
        if (gestureDetected && arMessage?.gestureTrigger === gestureDetected) {
            handleGestureDetected();
        }
    }, [gestureDetected, arMessage, handleGestureDetected]);

    useEffect(() => {
        return () => {
            if (cachedVideoUrl) {
                URL.revokeObjectURL(cachedVideoUrl);
            }
        };
    }, [cachedVideoUrl]);

    return (
        <div className="space-y-4">
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
                                <span className="absolute top-2 left-2 text-xs text-red-400 bg-gray-900/80 px-1 rounded">Recording</span>
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
                                            setRecordedVideoBlob(null);
                                            setSelectedGestureTrigger("");
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
                        {!arMessage.isViewed ? (
                            <div className="flex flex-col items-start space-y-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={openCameraPopup}
                                    className="text-purple-600 hover:text-purple-700"
                                >
                                    <Video className="w-4 h-4 mr-2" />
                                    Reveal AR Video ({arMessage.gestureTrigger})
                                </Button>
                                <span className="text-xs text-gray-500">Perform {arMessage.gestureTrigger} gesture to view</span>
                            </div>
                        ) : isPlaying && cachedVideoUrl ? (
                            <a-scene embedded arjs="sourceType: webcam;">
                                <a-video src={cachedVideoUrl} width="2" height="1.5" position="0 1.5 -3" rotation="0 0 0"></a-video>
                                <a-camera position="0 1.6 0"></a-camera>
                            </a-scene>
                        ) : (
                            <span className="text-sm text-gray-500">AR Video Viewed</span>
                        )}

                        <Dialog
                            open={isCameraDialogOpen}
                            onOpenChange={(open) => {
                                if (!open) {
                                    stopStream();
                                    setIsCameraDialogOpen(false);
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
                                            <span className={gestureDetected === arMessage?.gestureTrigger ? "text-green-400" : "text-gray-300"}>
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
        </div>
    );
};

export default ARVideoHologram;
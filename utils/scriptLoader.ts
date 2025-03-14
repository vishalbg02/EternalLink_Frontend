/**
 * Utility to preload MediaPipe Hands library
 */
export const preloadMediaPipeHands = async (): Promise<void> => {
    try {
        // Check if MediaPipe is already loaded
        if ((window as any).Hands) {
            return
        }

        // Load MediaPipe Hands script
        const script = document.createElement("script")
        script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js"
        script.async = true

        // Create a promise that resolves when the script loads
        const loadPromise = new Promise<void>((resolve, reject) => {
            script.onload = () => resolve()
            script.onerror = () => reject(new Error("Failed to load MediaPipe Hands"))
        })

        document.body.appendChild(script)
        await loadPromise

        // Wait a bit to ensure initialization
        await new Promise((resolve) => setTimeout(resolve, 500))

        console.log("MediaPipe Hands loaded successfully")
    } catch (error) {
        console.error("Error preloading MediaPipe Hands:", error)
        throw error
    }
}


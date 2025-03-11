// utils/scriptLoader.ts
const loadedScripts: Set<string> = new Set();

export const loadScriptOnce = (src: string, timeoutMs: number = 10000): Promise<void> => {
    if (loadedScripts.has(src)) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => {
            console.log(`Script loaded successfully: ${src}`);
            loadedScripts.add(src);
            resolve();
        };
        script.onerror = () => {
            const error = new Error(`Failed to load script: ${src}`);
            console.error(error.message);
            reject(error);
        };
        document.body.appendChild(script);

        // Timeout to prevent infinite waiting
        setTimeout(() => {
            if (!loadedScripts.has(src)) {
                reject(new Error(`Timeout loading script: ${src}`));
            }
        }, timeoutMs);
    });
};

// Preload MediaPipe Hands assets
export const preloadMediaPipeHands = async (): Promise<void> => {
    const handsScript = "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js";
    const assetsLoaderScript = "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands_solution_packed_assets_loader.js";

    try {
        await Promise.all([loadScriptOnce(handsScript), loadScriptOnce(assetsLoaderScript)]);

        // Wait for the Hands module to be available in the global scope
        const maxAttempts = 50;
        let attempts = 0;
        while (!(window as any).Hands && attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 100)); // Poll every 100ms
            attempts++;
        }

        if (!(window as any).Hands) {
            throw new Error("MediaPipe Hands module not initialized after loading scripts");
        }

        console.log("MediaPipe Hands module is ready");
    } catch (error) {
        console.error("Failed to preload MediaPipe Hands:", error);
        throw error;
    }
};
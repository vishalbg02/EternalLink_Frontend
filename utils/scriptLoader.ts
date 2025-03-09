// utils/scriptLoader.ts
const loadedScripts: Set<string> = new Set();

export const loadScriptOnce = (src: string): Promise<void> => {
    if (loadedScripts.has(src)) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => {
            loadedScripts.add(src);
            resolve();
        };
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.body.appendChild(script);
    });
};

// Preload MediaPipe Hands assets
export const preloadMediaPipeHands = async () => {
    const handsScript = "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js";
    const assetsLoaderScript = "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands_solution_packed_assets_loader.js";

    await Promise.all([loadScriptOnce(handsScript), loadScriptOnce(assetsLoaderScript)]);
};
// utils/aframe-loader.ts
"use client";

let aframeLoaded = false;

export const loadAFrame = (): Promise<void> => {
    if (aframeLoaded) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        if (typeof window === "undefined") {
            resolve(); // Don't load on server-side
            return;
        }

        const script = document.createElement("script");
        script.src = "https://aframe.io/releases/1.5.0/aframe.min.js"; // Use a specific version
        script.async = true;
        script.onload = () => {
            aframeLoaded = true;
            resolve();
        };
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
    });
};
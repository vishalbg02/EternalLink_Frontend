/** @type {import('next').NextConfig} */
const nextConfig = {
    /* config options here */
    async headers() {
        return [
            {
                // Serve Unity_.data.br with Brotli encoding
                source: "/unity-build/Unity_.data.br",
                headers: [
                    { key: "Content-Encoding", value: "br" },
                    { key: "Content-Type", value: "application/octet-stream" },
                ],
            },
            {
                // Serve Unity_.framework.js.br with Brotli encoding
                source: "/unity-build/Unity_.framework.js.br",
                headers: [
                    { key: "Content-Encoding", value: "br" },
                    { key: "Content-Type", value: "application/javascript" },
                ],
            },
            {
                // Serve Unity_.wasm.br with Brotli encoding
                source: "/unity-build/Unity_.wasm.br",
                headers: [
                    { key: "Content-Encoding", value: "br" },
                    { key: "Content-Type", value: "application/wasm" },
                ],
            },
            {
                // Serve Unity_.loader.js (uncompressed)
                source: "/unity-build/Unity_.loader.js",
                headers: [{ key: "Content-Type", value: "application/javascript" }],
            },
        ]
    },
}

module.exports = nextConfig


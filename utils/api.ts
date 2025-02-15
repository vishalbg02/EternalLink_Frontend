import { toast } from "react-hot-toast"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3080/api"

export async function apiRequest(
    endpoint: string,
    method = "GET",
    body: any = null,
    isFormData = false,
    responseType = "json",
) {
    const url = `${API_BASE_URL}${endpoint}`
    const headers: HeadersInit = {}

    // Add token if available
    const token = localStorage.getItem("token")
    if (token) {
        headers["Authorization"] = `Bearer ${token}`
    }

    // Set appropriate headers based on request type
    if (!isFormData) {
        headers["Content-Type"] = "application/json"
        headers["Accept"] = "application/json"
    }

    const options: RequestInit = {
        method,
        headers,
        credentials: "include",
    }

    // Handle request body
    if (body) {
        if (isFormData && body instanceof FormData) {
            options.body = body
            // Let the browser set the Content-Type for FormData
            delete headers["Content-Type"]
        } else if (method !== "GET") {
            options.body = JSON.stringify(body)
        }
    }

    try {
        const response = await fetch(url, options)

        // Handle authentication errors
        if (response.status === 401) {
            localStorage.removeItem("token")
            window.location.href = "/login"
            throw new Error("Session expired. Please login again.")
        }

        // Handle error responses
        if (!response.ok) {
            let errorMessage: string
            try {
                const errorData = await response.json()
                errorMessage = errorData.message || `Server error: ${response.statusText}`
            } catch {
                errorMessage = `Server error: ${response.statusText}`
            }
            throw new Error(errorMessage)
        }

        // Handle different response types
        if (response.status === 204) {
            return null
        }

        // Special handling for blob responses
        if (responseType === "blob") {
            const blob = await response.blob()
            if (blob.size === 0) {
                throw new Error("Downloaded file is empty")
            }
            const contentType = response.headers.get("content-type") || ""
            return { blob, contentType }
        }

        // Handle JSON responses
        const contentType = response.headers.get("content-type")
        if (contentType?.includes("application/json")) {
            return await response.json()
        }

        // Default to text response
        return await response.text()
    } catch (error) {
        console.error("API request failed:", error)
        const message = error instanceof Error ? error.message : "An unexpected error occurred"
        toast.error(message)
        throw error
    }
}


import * as React from "react"
import { cva } from "class-variance-authority"
import { AlertCircle, CheckCircle2, XCircle, Info } from "lucide-react"

const alertVariants = cva(
    "relative w-full rounded-lg border px-4 py-3 text-sm flex items-center gap-3",
    {
        variants: {
            variant: {
                default: "bg-background text-foreground border-border",
                destructive: "border-red-500/50 text-red-400 bg-red-500/10",
                success: "border-green-500/50 text-green-400 bg-green-500/10",
                warning: "border-yellow-500/50 text-yellow-400 bg-yellow-500/10",
                info: "border-blue-500/50 text-blue-400 bg-blue-500/10",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

const icons = {
    default: Info,
    destructive: XCircle,
    success: CheckCircle2,
    warning: AlertCircle,
    info: Info,
}

export function Alert({
                          variant = "default",
                          className = "",
                          children,
                          icon,
                          ...props
                      }) {
    const IconComponent = icon || icons[variant]

    return (
        <div
            role="alert"
            className={alertVariants({ variant, className })}
            {...props}
        >
            {IconComponent && (
                <IconComponent className="h-4 w-4" />
            )}
            <div className="w-full">{children}</div>
        </div>
    )
}

export function AlertTitle({ className = "", ...props }) {
    return (
        <h5
            className={`mb-1 font-medium leading-none tracking-tight ${className}`}
            {...props}
        />
    )
}

export function AlertDescription({ className = "", ...props }) {
    return (
        <div
            className={`text-sm opacity-90 ${className}`}
            {...props}
        />
    )
}

// Example usage:
export default function AlertDemo() {
    return (
        <div className="flex flex-col gap-4 w-full max-w-md">
            <Alert>
                <AlertTitle>Default Alert</AlertTitle>
                <AlertDescription>
                    This is a default alert message.
                </AlertDescription>
            </Alert>

            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    Something went wrong! Please try again.
                </AlertDescription>
            </Alert>

            <Alert variant="success">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                    Your changes have been saved successfully.
                </AlertDescription>
            </Alert>

            <Alert variant="warning">
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                    Please backup your data before continuing.
                </AlertDescription>
            </Alert>

            <Alert variant="info">
                <AlertTitle>Information</AlertTitle>
                <AlertDescription>
                    This feature is currently in beta.
                </AlertDescription>
            </Alert>
        </div>
    )
}
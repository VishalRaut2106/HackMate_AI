"use client"

import React, { useEffect, useRef, useState } from "react"
import mermaid from "mermaid"
import { Loader2 } from "lucide-react"

mermaid.initialize({
    startOnLoad: false,
    theme: "neutral",
    securityLevel: "loose",
    fontFamily: "inherit",
})

interface MermaidDiagramProps {
    chart: string
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
    const [svg, setSvg] = useState("")
    const [error, setError] = useState(false)
    const [loading, setLoading] = useState(true)
    const id = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`).current

    useEffect(() => {
        if (!chart) return

        const renderChart = async () => {
            try {
                setLoading(true)
                setError(false)

                // Auto-fix missing diagram type
                let code = chart.trim()
                const typeRegex = /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph|journey|mindmap|quadrantChart|requirementDiagram|c4)/

                if (!typeRegex.test(code)) {
                    if (code.includes("-->") || code.includes("---") || code.includes("==>")) {
                        code = "flowchart LR\n" + code
                    } else if (code.includes("->>") || code.includes("-->>")) {
                        code = "sequenceDiagram\n" + code
                    }
                }

                const { svg } = await mermaid.render(id, code)
                setSvg(svg)
            } catch (err) {
                console.error("Mermaid render error:", err)
                setError(true)
            } finally {
                setLoading(false)
            }
        }

        renderChart()
    }, [chart, id])

    if (error) {
        return (
            <div className="p-4 border border-destructive/50 rounded-md bg-destructive/10 text-destructive text-sm font-mono">
                Failed to render diagram
                <pre className="mt-2 text-xs opacity-70">{chart}</pre>
            </div>
        )
    }

    return (
        <div className="my-6 overflow-x-auto flex justify-center bg-white dark:bg-zinc-900/50 p-4 rounded-lg border">
            {loading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
            <div
                className={loading ? "hidden" : "w-full flex justify-center"}
                dangerouslySetInnerHTML={{ __html: svg }}
            />
        </div>
    )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Sparkles, Copy, FileText, Download, Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ReactMarkdown from "react-markdown"
import { MermaidDiagram } from "@/components/mermaid-diagram"

export default function DocsGeneratorPage() {
    const router = useRouter()
    const { toast } = useToast()

    const [projectName, setProjectName] = useState("")
    const [techStack, setTechStack] = useState("")
    const [description, setDescription] = useState("")
    const [features, setFeatures] = useState("")
    const [context, setContext] = useState("") // GitHub README or code
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedDocs, setGeneratedDocs] = useState("")

    const handleGenerate = async () => {
        if (!projectName.trim() || !techStack.trim() || !description.trim()) {
            toast({
                title: "Missing fields",
                description: "Please fill in all required fields.",
                variant: "destructive",
            })
            return
        }

        setIsGenerating(true)
        setGeneratedDocs("")

        try {
            const response = await fetch("/api/gemini", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "generate_docs",
                    data: {
                        projectName,
                        techStack,
                        description,
                        features: features.split("\n").filter(f => f.trim()),
                        context,
                    },
                }),
            })

            const data = await response.json()

            if (data.error) {
                throw new Error(data.error)
            }

            setGeneratedDocs(data.result)
            toast({
                title: "Documentation generated!",
                description: "Review and download your docs below.",
            })
        } catch (error: any) {
            toast({
                title: "Generation failed",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsGenerating(false)
        }
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generatedDocs)
            toast({ title: "Copied to clipboard!" })
        } catch (err) {
            toast({ title: "Failed to copy", variant: "destructive" })
        }
    }

    const handleDownload = () => {
        // Determine file name, sanitize it
        const fileName = `${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_documentation.md`

        // Create blob and download link
        const blob = new Blob([generatedDocs], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast({ title: "Downloaded as Markdown" })
    }

    // Helper to convert SVG string to JPEG Data URI
    const svgToJpeg = (svgString: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            // Encode SVG safely for data URI
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
            const url = URL.createObjectURL(svgBlob)

            img.onload = () => {
                const canvas = document.createElement('canvas')
                // Scale up for better quality (retina)
                const scale = 2
                canvas.width = img.width * scale
                canvas.height = img.height * scale
                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error("No canvas context"))
                    return
                }

                // Allow white background (JPEG doesn't support transparency)
                ctx.fillStyle = '#FFFFFF'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                ctx.scale(scale, scale)

                ctx.drawImage(img, 0, 0)
                URL.revokeObjectURL(url)
                // High quality JPEG
                resolve(canvas.toDataURL('image/jpeg', 0.95))
            }
            img.onerror = (e) => {
                URL.revokeObjectURL(url)
                reject(e)
            }
            img.src = url
        })
    }

    const handleDownloadPDF = async () => {
        if (!generatedDocs) return

        try {
            toast({ title: "Processing diagrams...", description: "Converting charts to images for PDF." })

            // 1. Pre-process Markdown: Find Mermaid blocks and convert to JPEG images
            let processedDocs = generatedDocs
            const mermaidRegex = /```mermaid([\s\S]*?)```/g
            let match

            // Collect matches first
            let matchArray = []
            while ((match = mermaidRegex.exec(generatedDocs)) !== null) {
                matchArray.push({ fullMatch: match[0], code: match[1], index: match.index })
            }

            // Import mermaid safely
            const mermaid = (await import("mermaid")).default
            // Initialize if needed (though component does it too, safer here)
            mermaid.initialize({ startOnLoad: false, theme: 'neutral' })

            for (const item of matchArray) {
                try {
                    const id = `pdf-chart-${Math.random().toString(36).substr(2, 9)}`
                    // Render SVG
                    // @ts-ignore
                    const { svg } = await mermaid.render(id, item.code.trim())
                    // Convert to JPEG
                    const jpegDataUrl = await svgToJpeg(svg)
                    // Create replacement markdown image
                    const replacement = `\n![Diagram](${jpegDataUrl})\n`

                    // Replace in string
                    processedDocs = processedDocs.replace(item.fullMatch, replacement)
                } catch (err) {
                    console.error("Failed to render diagram for PDF", err)
                }
            }

            toast({ title: "Generating PDF...", description: "Finalizing document." })

            // @ts-ignore
            const { markdown } = await import("tinypdf")

            // Generate PDF bytes from processed markdown
            const pdfBytes = markdown(processedDocs)

            // Create blob and force download
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_documentation.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            toast({ title: "PDF Downloaded!" })
        } catch (err) {
            console.error(err)
            toast({ title: "Failed to generate PDF", description: "See console for details.", variant: "destructive" })
        }
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 print:p-0 print:bg-white">
            <div className="container mx-auto max-w-5xl space-y-8 print:max-w-none print:space-y-0">

                {/* Header - Hidden on Print */}
                <div className="flex items-center gap-4 print:hidden">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                            Documentation Generator
                        </h1>
                        <p className="text-muted-foreground">
                            Turn your project idea or GitHub repo into academic-grade documentation in seconds.
                        </p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 print:block">

                    {/* Input Form - Hidden on Print */}
                    <div className="space-y-6 print:hidden">
                        <Card>
                            <CardHeader>
                                <CardTitle>Project Details</CardTitle>
                                <CardDescription>Tell us about your project</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="projectName">Project Name *</Label>
                                    <Input
                                        id="projectName"
                                        placeholder="e.g. HackMate AI"
                                        value={projectName}
                                        onChange={e => setProjectName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="techStack">Tech Stack *</Label>
                                    <Input
                                        id="techStack"
                                        placeholder="e.g. Next.js, Firebase, Tailwind"
                                        value={techStack}
                                        onChange={e => setTechStack(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description *</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="What does it do? Who is it for?"
                                        className="min-h-[100px]"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="features">Key Features (One per line)</Label>
                                    <Textarea
                                        id="features"
                                        placeholder="- Authentication&#10;- Real-time Chat&#10;- Dashboard"
                                        className="min-h-[100px]"
                                        value={features}
                                        onChange={e => setFeatures(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="context">Extra Context (Optional)</Label>
                                    <Textarea
                                        id="context"
                                        placeholder="Paste your GitHub README, code snippets, or specific requirements here..."
                                        className="min-h-[100px]"
                                        value={context}
                                        onChange={e => setContext(e.target.value)}
                                    />
                                </div>

                                <Button
                                    onClick={handleGenerate}
                                    className="w-full"
                                    size="lg"
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Generating Docs...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4 mr-2" />
                                            Generate Documentation
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Preview Area - Full Width on Print */}
                    <div className="space-y-6 print:space-y-0">
                        <Card className="h-full flex flex-col min-h-[600px] print:min-h-0 print:shadow-none print:border-none">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 print:hidden">
                                <div className="space-y-1">
                                    <CardTitle>Preview</CardTitle>
                                    <CardDescription>Generated Output (Markdown)</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={handleCopy} disabled={!generatedDocs}>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => window.print()} disabled={!generatedDocs}>
                                        <Printer className="h-4 w-4 mr-2" />
                                        Print
                                    </Button>
                                    <Button variant="default" size="sm" onClick={handleDownloadPDF} disabled={!generatedDocs}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Download PDF
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 print:p-0">
                                {generatedDocs ? (
                                    <div
                                        id="pdf-content"
                                        className="prose dark:prose-invert max-w-none h-[calc(100vh-300px)] overflow-y-auto p-4 border rounded-md bg-white dark:bg-zinc-950 text-black dark:text-gray-100 print:h-auto print:overflow-visible print:border-none print:p-0"
                                    >
                                        <ReactMarkdown
                                            components={{
                                                code({ node, className, children, ...props }) {
                                                    const match = /language-(\w+)/.exec(className || "")
                                                    const isMermaid = match && match[1] === "mermaid"

                                                    if (isMermaid) {
                                                        return (
                                                            <div className="flex justify-center p-4 my-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                                                                <MermaidDiagram chart={String(children).replace(/\n$/, "")} />
                                                            </div>
                                                        )
                                                    }

                                                    return (
                                                        <code className={className} {...props}>
                                                            {children}
                                                        </code>
                                                    )
                                                }
                                            }}
                                        >
                                            {generatedDocs}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 border-2 border-dashed rounded-md print:hidden">
                                        <FileText className="h-12 w-12 mb-4 opacity-50" />
                                        <p className="text-center">Your documentation will appear here.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    )
}

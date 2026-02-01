"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Loader2, Github, GitCommit, ExternalLink, Calendar, AlertTriangle } from "lucide-react"

interface Commit {
    sha: string
    message: string
    author: {
        name: string
        date: string
        avatar_url?: string
    }
    html_url: string
}

interface GithubHistoryProps {
    repoUrl?: string
}

export function GithubHistory({ repoUrl }: GithubHistoryProps) {
    const [commits, setCommits] = useState<Commit[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!repoUrl) return

        const fetchCommits = async () => {
            setLoading(true)
            setError(null)
            try {
                const response = await fetch(`/api/github/commits?url=${encodeURIComponent(repoUrl)}`)
                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || "Failed to fetch commits")
                }

                setCommits(data.commits)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchCommits()
    }, [repoUrl])

    if (!repoUrl) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Github className="h-12 w-12 mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Repository Linked</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                        Connect a GitHub repository to view commit history.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="h-[600px] flex flex-col">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <Github className="h-5 w-5" />
                            Commit History
                        </CardTitle>
                        <CardDescription className="line-clamp-1">
                            Latest updates from {repoUrl.replace("https://github.com/", "")}
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <a href={repoUrl} target="_blank" rel="noopener noreferrer">
                            View Repo <ExternalLink className="ml-2 h-3 w-3" />
                        </a>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading commits...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
                        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-destructive">Unable to load commits</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
                        </div>
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            Try Again
                        </Button>
                    </div>
                ) : commits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                        <GitCommit className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                        <p className="text-muted-foreground">No commits found in the last 90 days.</p>
                    </div>
                ) : (
                    <ScrollArea className="h-full">
                        <div className="divide-y">
                            {commits.map((commit) => (
                                <div key={commit.sha} className="p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            {commit.author.avatar_url ? (
                                                <img
                                                    src={commit.author.avatar_url}
                                                    alt={commit.author.name}
                                                    className="h-8 w-8 rounded-full border"
                                                />
                                            ) : (
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary border">
                                                    {commit.author.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="font-medium text-sm truncate">{commit.author.name}</span>
                                                <div className="flex items-center text-xs text-muted-foreground shrink-0">
                                                    <Calendar className="mr-1 h-3 w-3" />
                                                    {new Date(commit.author.date).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <p className="text-sm text-foreground/90 line-clamp-2 mb-2 font-mono text-xs">
                                                {commit.message}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="font-mono text-[10px] h-5">
                                                    {commit.sha.substring(0, 7)}
                                                </Badge>
                                                <a
                                                    href={commit.html_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-primary hover:underline flex items-center"
                                                >
                                                    View Code <ExternalLink className="ml-1 h-2.5 w-2.5" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    )
}
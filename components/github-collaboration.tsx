'use client'

import React, { useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { updateProjectUrls } from '@/lib/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  Github,
  ExternalLink,
  Copy,
  Check,
  Trash2,
} from 'lucide-react'
import { GithubHistory } from './github-history'

interface GitHubCollaborationProps {
  projectId: string
  initialRepoUrl?: string
}

export function GitHubCollaboration({ projectId, initialRepoUrl }: GitHubCollaborationProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // State
  const [repoUrl, setRepoUrl] = useState(initialRepoUrl || '')
  const [isConnected, setIsConnected] = useState(!!initialRepoUrl)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  // Validate GitHub URL
  const isValidGitHubUrl = useCallback((url: string) => {
    const patterns = [
      /^https:\/\/github\.com\/[^\/]+\/[^\/]+/,
      /^git@github\.com:[^\/]+\/[^\/]+\.git$/,
    ]
    return patterns.some(pattern => pattern.test(url))
  }, [])

  // Save repository URL
  const handleSaveRepo = async () => {
    if (!repoUrl.trim()) {
      toast({
        title: 'Repository URL required',
        description: 'Please enter a GitHub repository URL',
        variant: 'destructive',
      })
      return
    }

    if (!isValidGitHubUrl(repoUrl.trim())) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid GitHub repository URL',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      await updateProjectUrls(projectId, { github_repo: repoUrl.trim() })
      setIsConnected(true)
      
      toast({
        title: 'Repository saved!',
        description: 'GitHub repository has been linked to your project',
      })
    } catch (error: any) {
      toast({
        title: 'Failed to save',
        description: error.message || 'Failed to save repository URL',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Remove repository connection
  const handleRemoveRepo = async () => {
    setIsSaving(true)
    try {
      await updateProjectUrls(projectId, { github_repo: undefined })
      setRepoUrl('')
      setIsConnected(false)
      
      toast({
        title: 'Repository removed',
        description: 'GitHub repository has been unlinked from your project',
      })
    } catch (error: any) {
      toast({
        title: 'Failed to remove',
        description: error.message || 'Failed to remove repository',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Copy repository URL
  const handleCopyUrl = async () => {
    if (repoUrl) {
      await navigator.clipboard.writeText(repoUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      
      toast({
        title: 'URL copied',
        description: 'Repository URL copied to clipboard',
      })
    }
  }

  // Extract repository name from URL
  const getRepoName = useCallback((url: string) => {
    const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/)
    return match ? match[1].replace('.git', '') : url
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Repository
          </CardTitle>
          <CardDescription>
            Link your project to a GitHub repository for version control and collaboration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="repo-url">Repository URL</Label>
                <Input
                  id="repo-url"
                  placeholder="https://github.com/username/repository"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={handleSaveRepo} 
                disabled={isSaving || !repoUrl.trim()}
                className="w-full"
              >
                {isSaving ? 'Saving...' : 'Connect Repository'}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Github className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{getRepoName(repoUrl)}</p>
                    <p className="text-sm text-muted-foreground">Connected repository</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCopyUrl}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={repoUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRemoveRepo}
                    disabled={isSaving}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>✅ Repository linked successfully</p>
                <p>Team members can now access the code repository directly.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Setup Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p className="font-medium">To set up your hackathon repository:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2 text-muted-foreground">
              <li>Create a new repository on GitHub</li>
              <li>Add your team members as collaborators</li>
              <li>Copy the repository URL and paste it above</li>
              <li>Clone the repository locally: <code className="bg-muted px-1 rounded">git clone [URL]</code></li>
              <li>Start coding and push your changes regularly</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Commit History */}
      {isConnected && repoUrl && (
        <GithubHistory repoUrl={repoUrl} />
      )}
    </div>
  )
}
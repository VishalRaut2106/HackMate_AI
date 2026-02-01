"use client"

import { useEffect, useState, use } from "react"
import { subscribeToProject, subscribeToTasks, getProjectMembers } from "@/lib/firestore"
import type { Project, Task, ProjectMember } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Rocket, Target, Users, Zap, CheckCircle2, Clock, AlertTriangle, ListTodo } from "lucide-react"

export default function DemoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params)
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return

    const unsubProject = subscribeToProject(projectId, async (proj) => {
      setProject(proj)
      setLoading(false)
      if (proj) {
        const projectMembers = await getProjectMembers(proj.members || [])
        setMembers(projectMembers)
      }
    })

    const unsubTasks = subscribeToTasks(projectId, setTasks)

    return () => {
      unsubProject()
      unsubTasks()
    }
  }, [projectId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!project || !project.demo_mode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Demo Not Available</CardTitle>
            <CardDescription>This project is not in demo mode or doesn't exist.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const completedTasks = tasks.filter((t) => t.status === "Done").length
  const totalTasks = tasks.length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
                <Rocket className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <p className="text-muted-foreground">Demo Presentation</p>
              </div>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Clock className="h-4 w-4 mr-2" />
              {project.duration} Hackathon
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Progress Overview */}
        <Card className="border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">{progress}% Complete</h2>
                <p className="text-muted-foreground">
                  {completedTasks} of {totalTasks} tasks done
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{members.length}</div>
                <p className="text-muted-foreground">Team Members</p>
              </div>
            </div>
            <Progress value={progress} className="h-4" />
          </CardContent>
        </Card>

        {project.idea && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Problem Statement */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Target className="h-6 w-6 text-primary" />
                  Problem Statement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed">{project.idea.problem_statement}</p>
              </CardContent>
            </Card>

            {/* Target Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Target Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {project.idea.target_users?.map((user, i) => (
                    <Badge key={i} variant="secondary" className="text-base px-4 py-2">
                      {user}
                    </Badge>
                  )) || <p className="text-muted-foreground">No target users defined</p>}
                </div>
              </CardContent>
            </Card>

            {/* Tech Stack */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Technology Stack
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {project.idea.tech_stack_suggestions?.map((tech, i) => (
                    <Badge key={i} variant="outline" className="text-base px-4 py-2">
                      {tech}
                    </Badge>
                  )) || <p className="text-muted-foreground">No tech stack suggestions</p>}
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Key Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {project.idea.features?.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <span className="text-base">{feature}</span>
                    </li>
                  )) || <p className="text-muted-foreground">No features defined</p>}
                </ul>
              </CardContent>
            </Card>

            {/* Risks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Challenges & Mitigations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {project.idea.risks?.map((risk, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-base">{risk}</span>
                    </li>
                  )) || <p className="text-muted-foreground">No risks identified</p>}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Task Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-primary" />
              Task Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{tasks.filter((t) => t.status === "ToDo").length}</div>
                <div className="text-muted-foreground">To Do</div>
              </div>
              <div className="bg-amber-100 text-amber-900 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{tasks.filter((t) => t.status === "InProgress").length}</div>
                <div className="text-amber-800">In Progress</div>
              </div>
              <div className="bg-primary/10 text-primary rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{tasks.filter((t) => t.status === "Done").length}</div>
                <div className="text-primary/80">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              The Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {members.map((member) => (
                <div key={member.user_id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                    {member.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {member.skills?.slice(0, 2).join(", ") || "Team Member"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>Built with HackMate AI • Powered by Google Gemini</p>
        </div>
      </footer>
    </div>
  )
}

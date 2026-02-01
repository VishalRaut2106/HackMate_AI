"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Activity, Info, TrendingUp, Users, Clock, Code } from "lucide-react"
import { calculateProjectHealth } from "@/lib/health-utils"
import { Project, Task, ProjectMember } from "@/lib/types"

interface ProjectHealthProps {
    project: Project
    tasks: Task[]
    members: ProjectMember[]
    commitsCount?: number
    now?: number
}

export function ProjectHealth({ project, tasks, members, commitsCount = 0, now }: ProjectHealthProps) {
    const health = useMemo(
        () => calculateProjectHealth(project, tasks, members, commitsCount, now),
        [project, tasks, members, commitsCount, now]
    )

    const getFactorIcon = (label: string) => {
        switch (label) {
            case "Tasks": return <TrendingUp className="h-3 w-3" />
            case "Time": return <Clock className="h-3 w-3" />
            case "Code": return <Code className="h-3 w-3" />
            case "Team": return <Users className="h-3 w-3" />
            default: return <Activity className="h-3 w-3" />
        }
    }

    return (
        <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-background to-muted/50">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        Project Health
                    </CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="cursor-help">
                                    <Badge className={`${health.color} border-none font-bold px-3 py-1`}>
                                        {health.label}
                                    </Badge>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="w-64 p-3 space-y-2">
                                <p className="font-semibold text-xs border-bottom pb-1">Health Distribution</p>
                                {health.factors.map((factor) => (
                                    <div key={factor.label} className="space-y-1">
                                        <div className="flex justify-between text-[10px] text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                {getFactorIcon(factor.label)} {factor.label}
                                            </span>
                                            <span>{factor.score}%</span>
                                        </div>
                                        <Progress value={factor.score} className="h-1" />
                                    </div>
                                ))}
                                <p className="text-[10px] text-muted-foreground mt-2 italic">
                                    Score is calculated based on code activity, task progress, and member collaboration.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-end justify-between">
                        <span className="text-3xl font-bold tracking-tight">{health.score}%</span>
                        <span className="text-xs text-muted-foreground pb-1">Overall Score</span>
                    </div>
                    <Progress value={health.score} className={`h-2 ${health.score < 50 ? 'bg-red-100' : health.score < 80 ? 'bg-yellow-100' : 'bg-green-100'}`} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {health.factors.slice(0, 2).map((factor) => (
                        <div key={factor.label} className="bg-background/50 rounded-lg p-2 border border-border/50">
                            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                                {getFactorIcon(factor.label)}
                                <span className="text-[10px] font-medium uppercase tracking-wider">{factor.label}</span>
                            </div>
                            <div className="text-sm font-semibold">{factor.score}%</div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

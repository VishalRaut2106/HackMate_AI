import { Project, Task, ProjectMember } from "./types"

export interface HealthScore {
    score: number
    status: "Healthy" | "At Risk" | "Critical"
    label: string
    color: string
    factors: {
        label: string
        score: number
        weight: number
    }[]
}

export function calculateProjectHealth(
    project: Project,
    tasks: Task[],
    members: ProjectMember[],
    commitsCount: number = 0,
    now: number = Date.now()
): HealthScore {
    // 1. Task Completion (30%)
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.status === "Done").length
    const taskScore = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100

    // 2. Time Pressure (25%)
    const start = new Date(project.createdAt)
    const duration = project.duration === "24h" ? 24 : 48
    const end = new Date(start.getTime() + duration * 60 * 60 * 1000)
    const totalDurationMs = duration * 60 * 60 * 1000
    const elapsedMs = now - start.getTime()
    const progressRatio = Math.min(Math.max(elapsedMs / totalDurationMs, 0), 1)

    // If we've completed more of the work than the time that has passed, we're doing well.
    // progressRatio is how much time passed (0 to 1)
    // completionRatio is (completedTasks / totalTasks) (0 to 1)
    const completionRatio = totalTasks > 0 ? completedTasks / totalTasks : 1
    const timeScore = progressRatio > 0
        ? Math.min((completionRatio / (progressRatio * 0.8)) * 100, 100)
        : 100

    // 3. Commit Frequency (30%)
    // Expecting at least 2 commits per member per 24h phase for "Full Health"
    const expectedCommits = Math.max(members.length * (duration / 12), 1)
    const commitScore = Math.min((commitsCount / expectedCommits) * 100, 100)

    // 4. Contributor Activity (15%)
    // Check if tasks are balanced among members or if one or two people are carrying everyone
    const assignedTasks = tasks.filter(t => t.assigned_to).length
    const memberActivityMap = tasks.reduce((acc, t) => {
        if (t.assigned_to) {
            acc[t.assigned_to] = (acc[t.assigned_to] || 0) + 1
        }
        return acc
    }, {} as Record<string, number>)

    const activeMembersCount = Object.keys(memberActivityMap).length
    const activityScore = members.length > 0
        ? (activeMembersCount / members.length) * 100
        : 100

    // Final Weighted Score
    const weightedScore = Math.round(
        taskScore * 0.3 +
        timeScore * 0.25 +
        commitScore * 0.3 +
        activityScore * 0.15
    )

    let status: HealthScore["status"] = "Healthy"
    let color = "text-green-500 bg-green-500/10"
    let label = "🟢 Healthy"

    if (weightedScore < 50) {
        status = "Critical"
        color = "text-red-500 bg-red-500/10"
        label = "🔴 Critical"
    } else if (weightedScore < 80) {
        status = "At Risk"
        color = "text-yellow-500 bg-yellow-500/10"
        label = "🟡 At Risk"
    }

    return {
        score: weightedScore,
        status,
        label,
        color,
        factors: [
            { label: "Tasks", score: Math.round(taskScore), weight: 0.3 },
            { label: "Time", score: Math.round(timeScore), weight: 0.25 },
            { label: "Code", score: Math.round(commitScore), weight: 0.3 },
            { label: "Team", score: Math.round(activityScore), weight: 0.15 },
        ],
    }
}

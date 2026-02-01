import { Project, Task, ChatMessage, IdeaAnalysis, ProjectMember } from './types';

export interface ExportOptions {
  includeIdea?: boolean;
  includeTasks?: boolean;
  includeAnalytics?: boolean;
  includeTeam?: boolean;
  includeChat?: boolean;
  format: 'pdf' | 'json' | 'csv';
}

export interface ProjectExportData {
  project: Project;
  tasks: Task[];
  members: ProjectMember[];
  messages?: ChatMessage[];
  analytics?: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    timeElapsed: string;
    teamVelocity: number;
  };
}

export class ExportService {
  async exportProject(
    projectData: ProjectExportData,
    options: ExportOptions
  ): Promise<Blob> {
    switch (options.format) {
      case 'pdf':
        return this.exportToPDF(projectData, options);
      case 'json':
        return this.exportToJSON(projectData, options);
      case 'csv':
        return this.exportToCSV(projectData, options);
      default:
        throw new Error('Unsupported export format');
    }
  }

  private async exportToPDF(
    data: ProjectExportData,
    options: ExportOptions
  ): Promise<Blob> {
    // Create HTML content for PDF generation
    const htmlContent = this.generateHTMLReport(data, options);
    
    // Use browser's print functionality to generate PDF
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print window');
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load
    await new Promise(resolve => {
      printWindow.onload = resolve;
      setTimeout(resolve, 1000); // Fallback timeout
    });

    // Trigger print dialog
    printWindow.print();
    printWindow.close();

    // For now, return a placeholder blob
    // In a real implementation, you'd use a library like jsPDF or Puppeteer
    return new Blob([htmlContent], { type: 'text/html' });
  }

  private exportToJSON(
    data: ProjectExportData,
    options: ExportOptions
  ): Blob {
    const exportData: any = {
      project: {
        name: data.project.name,
        duration: data.project.duration,
        status: data.project.status,
        createdAt: data.project.createdAt,
        join_code: data.project.join_code,
      }
    };

    if (options.includeIdea && data.project.idea) {
      exportData.idea = data.project.idea;
    }

    if (options.includeTasks) {
      exportData.tasks = data.tasks.map(task => ({
        title: task.title,
        description: task.description,
        status: task.status,
        effort: task.effort,
        priority: task.priority,
        assigned_to: task.assigned_to,
        created_at: task.created_at,
      }));
    }

    if (options.includeTeam) {
      exportData.team = data.members.map(member => ({
        name: member.name,
        email: member.email,
        role: member.role,
        skills: member.skills,
      }));
    }

    if (options.includeAnalytics && data.analytics) {
      exportData.analytics = data.analytics;
    }

    if (options.includeChat && data.messages) {
      exportData.messages = data.messages.map(msg => ({
        sender_type: msg.sender_type,
        content: msg.content,
        timestamp: msg.timestamp,
      }));
    }

    const jsonString = JSON.stringify(exportData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  private exportToCSV(
    data: ProjectExportData,
    options: ExportOptions
  ): Blob {
    if (!options.includeTasks) {
      throw new Error('CSV export requires tasks to be included');
    }

    const headers = [
      'Task Title',
      'Description',
      'Status',
      'Effort',
      'Priority',
      'Assigned To',
      'Created Date'
    ];

    const rows = data.tasks.map(task => [
      task.title,
      task.description || '',
      task.status,
      task.effort,
      task.priority || '',
      task.assigned_to || 'Unassigned',
      task.created_at ? new Date(task.created_at).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv' });
  }

  private generateHTMLReport(
    data: ProjectExportData,
    options: ExportOptions
  ): string {
    const { project, tasks, members, analytics } = data;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${project.name} - Project Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .project-title {
            font-size: 2.5em;
            margin: 0;
            color: #2563eb;
        }
        .project-meta {
            color: #666;
            margin-top: 10px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 1.5em;
            color: #1f2937;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        .idea-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .problem-statement {
            font-style: italic;
            color: #4b5563;
            margin-bottom: 15px;
        }
        .features-list {
            list-style-type: none;
            padding: 0;
        }
        .features-list li {
            padding: 5px 0;
            border-left: 3px solid #10b981;
            padding-left: 15px;
            margin-bottom: 5px;
        }
        .tech-stack {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
        }
        .tech-badge {
            background: #e5e7eb;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.9em;
        }
        .tasks-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .tasks-table th,
        .tasks-table td {
            border: 1px solid #e5e7eb;
            padding: 8px 12px;
            text-align: left;
        }
        .tasks-table th {
            background: #f9fafb;
            font-weight: 600;
        }
        .status-badge {
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: 500;
        }
        .status-todo { background: #fef3c7; color: #92400e; }
        .status-inprogress { background: #dbeafe; color: #1e40af; }
        .status-done { background: #d1fae5; color: #065f46; }
        .analytics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 15px;
        }
        .metric-card {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #2563eb;
        }
        .metric-label {
            color: #6b7280;
            font-size: 0.9em;
        }
        .team-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .member-card {
            border: 1px solid #e5e7eb;
            padding: 15px;
            border-radius: 8px;
        }
        .member-name {
            font-weight: 600;
            margin-bottom: 5px;
        }
        .member-role {
            color: #6b7280;
            font-size: 0.9em;
        }
        .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 0.9em;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="project-title">${project.name}</h1>
        <div class="project-meta">
            <strong>Duration:</strong> ${project.duration} | 
            <strong>Status:</strong> ${project.status} | 
            <strong>Created:</strong> ${new Date(data.project.createdAt).toLocaleDateString()}
        </div>
    </div>

    ${options.includeIdea && project.idea ? `
    <div class="section">
        <h2 class="section-title">Project Idea</h2>
        <div class="idea-section">
            <div class="problem-statement">
                <strong>Problem Statement:</strong><br>
                ${project.idea.problem_statement}
            </div>
            
            ${project.idea.target_users && project.idea.target_users.length > 0 ? `
            <div>
                <strong>Target Users:</strong><br>
                ${project.idea.target_users.join(', ')}
            </div>
            ` : ''}

            ${project.idea.features && project.idea.features.length > 0 ? `
            <div>
                <strong>Key Features:</strong>
                <ul class="features-list">
                    ${project.idea.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            </div>
            ` : ''}

            ${project.idea.tech_stack_suggestions && project.idea.tech_stack_suggestions.length > 0 ? `
            <div>
                <strong>Suggested Tech Stack:</strong>
                <div class="tech-stack">
                    ${project.idea.tech_stack_suggestions.map(tech => `<span class="tech-badge">${tech}</span>`).join('')}
                </div>
            </div>
            ` : ''}

            ${project.idea.risks && project.idea.risks.length > 0 ? `
            <div style="margin-top: 15px;">
                <strong>Identified Risks:</strong>
                <ul>
                    ${project.idea.risks.map(risk => `<li>${risk}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
    </div>
    ` : ''}

    ${options.includeTasks ? `
    <div class="section">
        <h2 class="section-title">Tasks (${tasks.length})</h2>
        <table class="tasks-table">
            <thead>
                <tr>
                    <th>Task</th>
                    <th>Status</th>
                    <th>Effort</th>
                    <th>Priority</th>
                    <th>Assigned To</th>
                </tr>
            </thead>
            <tbody>
                ${tasks.map(task => `
                <tr>
                    <td>
                        <strong>${task.title}</strong>
                        ${task.description ? `<br><small style="color: #6b7280;">${task.description}</small>` : ''}
                    </td>
                    <td>
                        <span class="status-badge status-${task.status.toLowerCase()}">
                            ${task.status === 'ToDo' ? 'To Do' : task.status === 'InProgress' ? 'In Progress' : task.status}
                        </span>
                    </td>
                    <td>${task.effort}</td>
                    <td>${task.priority || '-'}</td>
                    <td>${task.assigned_to ? members.find(m => m.user_id === task.assigned_to)?.name || 'Unknown' : 'Unassigned'}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    ${options.includeAnalytics && analytics ? `
    <div class="section">
        <h2 class="section-title">Project Analytics</h2>
        <div class="analytics-grid">
            <div class="metric-card">
                <div class="metric-value">${analytics.completedTasks}</div>
                <div class="metric-label">Tasks Completed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(analytics.completionRate * 100)}%</div>
                <div class="metric-label">Completion Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${analytics.teamVelocity.toFixed(1)}</div>
                <div class="metric-label">Tasks/Hour</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${analytics.timeElapsed}</div>
                <div class="metric-label">Time Elapsed</div>
            </div>
        </div>
    </div>
    ` : ''}

    ${options.includeTeam ? `
    <div class="section">
        <h2 class="section-title">Team Members (${members.length})</h2>
        <div class="team-grid">
            ${members.map(member => `
            <div class="member-card">
                <div class="member-name">${member.name}</div>
                <div class="member-role">${member.role || 'Team Member'}</div>
                ${member.skills && member.skills.length > 0 ? `
                <div style="margin-top: 8px;">
                    <small style="color: #6b7280;">Skills:</small><br>
                    <div class="tech-stack">
                        ${member.skills.map(skill => `<span class="tech-badge">${skill}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    <div class="footer">
        <p>Generated by HackMate AI on ${new Date().toLocaleDateString()}</p>
        <p>Project Code: ${project.join_code}</p>
    </div>
</body>
</html>
    `;
  }

  async generatePitchDeck(
    data: ProjectExportData
  ): Promise<Blob> {
    const { project } = data;
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${project.name} - Pitch Deck</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .slide {
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 40px;
            box-sizing: border-box;
            page-break-after: always;
        }
        .slide h1 {
            font-size: 4em;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .slide h2 {
            font-size: 3em;
            margin-bottom: 30px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .slide p {
            font-size: 1.5em;
            max-width: 800px;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            max-width: 1000px;
            margin-top: 40px;
        }
        .feature-card {
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        .tech-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            max-width: 800px;
            margin-top: 40px;
        }
        .tech-item {
            background: rgba(255,255,255,0.2);
            padding: 15px;
            border-radius: 10px;
            font-weight: 600;
        }
        @media print {
            .slide { page-break-after: always; }
        }
    </style>
</head>
<body>
    <!-- Title Slide -->
    <div class="slide">
        <h1>${project.name}</h1>
        <p style="font-size: 2em; opacity: 0.9;">Hackathon Project Pitch</p>
        <p style="font-size: 1.2em; margin-top: 40px;">
            ${project.duration} Challenge | ${new Date(project.createdAt).toLocaleDateString()}
        </p>
    </div>

    ${project.idea ? `
    <!-- Problem Slide -->
    <div class="slide">
        <h2>The Problem</h2>
        <p style="font-size: 2em; font-weight: 300;">
            ${project.idea.problem_statement}
        </p>
    </div>

    <!-- Solution Slide -->
    <div class="slide">
        <h2>Our Solution</h2>
        <div class="features-grid">
            ${project.idea.features ? project.idea.features.slice(0, 4).map(feature => `
            <div class="feature-card">
                <h3 style="margin-top: 0;">${feature}</h3>
            </div>
            `).join('') : ''}
        </div>
    </div>

    ${project.idea.tech_stack_suggestions ? `
    <!-- Tech Stack Slide -->
    <div class="slide">
        <h2>Technology Stack</h2>
        <div class="tech-grid">
            ${project.idea.tech_stack_suggestions.map(tech => `
            <div class="tech-item">${tech}</div>
            `).join('')}
        </div>
    </div>
    ` : ''}
    ` : ''}

    <!-- Team Slide -->
    <div class="slide">
        <h2>Our Team</h2>
        <p style="font-size: 1.8em;">
            ${data.members.length} talented developers working together
        </p>
        <div style="margin-top: 40px;">
            ${data.members.map(member => `
            <div style="display: inline-block; margin: 20px; text-align: center;">
                <div style="font-size: 1.5em; font-weight: 600;">${member.name}</div>
                <div style="opacity: 0.8;">${member.role || 'Developer'}</div>
            </div>
            `).join('')}
        </div>
    </div>

    <!-- Progress Slide -->
    <div class="slide">
        <h2>What We Built</h2>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; max-width: 900px; margin-top: 40px;">
            <div style="text-align: center;">
                <div style="font-size: 4em; font-weight: bold;">${data.tasks.filter(t => t.status === 'Done').length}</div>
                <div style="font-size: 1.2em;">Tasks Completed</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 4em; font-weight: bold;">${data.tasks.length}</div>
                <div style="font-size: 1.2em;">Total Tasks</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 4em; font-weight: bold;">${Math.round((data.tasks.filter(t => t.status === 'Done').length / data.tasks.length) * 100)}%</div>
                <div style="font-size: 1.2em;">Complete</div>
            </div>
        </div>
    </div>

    <!-- Thank You Slide -->
    <div class="slide">
        <h1>Thank You!</h1>
        <p style="font-size: 2em; margin-top: 40px;">Questions?</p>
        <p style="font-size: 1.2em; margin-top: 60px; opacity: 0.8;">
            Project Code: ${project.join_code}
        </p>
    </div>
</body>
</html>
    `;

    return new Blob([htmlContent], { type: 'text/html' });
  }
}

export const exportService = new ExportService();
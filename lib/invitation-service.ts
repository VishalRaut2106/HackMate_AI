import { Project } from './types';

export interface TeamInvitation {
  id: string;
  projectId: string;
  projectName: string;
  inviterName: string;
  inviterEmail: string;
  inviteeEmail: string;
  joinCode: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  message?: string;
}

export class InvitationService {
  private static STORAGE_KEY = 'hackmate_invitations';

  static async sendEmailInvitation(
    project: Project,
    inviterName: string,
    inviterEmail: string,
    inviteeEmail: string,
    message?: string
  ): Promise<TeamInvitation> {
    // Use crypto.randomUUID if available, otherwise fallback to a timestamp-based approach
    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `inv_${crypto.randomUUID()}`;
      }
      // Fallback for environments without crypto.randomUUID
      return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    const invitation: TeamInvitation = {
      id: generateId(),
      projectId: project.id,
      projectName: project.name,
      inviterName,
      inviterEmail,
      inviteeEmail,
      joinCode: project.join_code || '',
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      message
    };

    // Store invitation locally first
    this.storeInvitation(invitation);

    try {
      // Send email invitation
      await this.simulateEmailSend(invitation);
      console.log('Invitation created and email sent successfully');
    } catch (error) {
      console.error('Failed to send email for invitation:', invitation.id, error);
      // The invitation is still stored locally, but email failed
      // You might want to add a status field to track this
      throw error; // Re-throw so the UI can show the error
    }

    return invitation;
  }

  private static storeInvitation(invitation: TeamInvitation): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const invitations: TeamInvitation[] = stored ? JSON.parse(stored) : [];
      invitations.push(invitation);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(invitations));
    } catch (error) {
      console.error('Failed to store invitation:', error);
    }
  }

  private static async simulateEmailSend(invitation: TeamInvitation): Promise<void> {
    // Send actual email using the API route
    try {
      const inviteUrl = this.generateInvitationLink(invitation.joinCode, invitation.id);
      
      console.log('Sending invitation email via API...', {
        to: invitation.inviteeEmail,
        project: invitation.projectName,
        inviter: invitation.inviterName
      });

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'invitation',
          inviteeEmail: invitation.inviteeEmail,
          inviterName: invitation.inviterName,
          projectName: invitation.projectName,
          joinCode: invitation.joinCode,
          inviteUrl,
          message: invitation.message,
        }),
      });

      console.log('API Response status:', response.status);
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error('API response error:', errorData);
        throw new Error(errorData.error || errorData.details || `HTTP ${response.status}: Failed to send email`);
      }

      const result = await response.json();
      console.log('📧 Email invitation sent successfully to:', invitation.inviteeEmail, result);
    } catch (error) {
      console.error('Failed to send invitation email:', error);
      
      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to email service. Please check your internet connection.');
      }
      
      if (error instanceof Error) {
        throw new Error(`Email sending failed: ${error.message}`);
      }
      
      throw new Error('Email sending failed: Unknown error occurred');
    }
  }

  static getInvitations(projectId?: string): TeamInvitation[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const invitations: TeamInvitation[] = stored ? JSON.parse(stored) : [];
      
      return projectId 
        ? invitations.filter(inv => inv.projectId === projectId)
        : invitations;
    } catch (error) {
      console.error('Failed to load invitations:', error);
      return [];
    }
  }

  static updateInvitationStatus(invitationId: string, status: TeamInvitation['status']): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const invitations: TeamInvitation[] = stored ? JSON.parse(stored) : [];
      
      const invitation = invitations.find(inv => inv.id === invitationId);
      if (invitation) {
        invitation.status = status;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(invitations));
      }
    } catch (error) {
      console.error('Failed to update invitation status:', error);
    }
  }

  static isInvitationValid(invitation: TeamInvitation): boolean {
    return invitation.status === 'pending' && new Date() < new Date(invitation.expiresAt);
  }

  static generateInvitationLink(joinCode: string, invitationId?: string): string {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://hackmate-ai.com';
    const params = new URLSearchParams({ code: joinCode });
    if (invitationId) {
      params.append('invitation', invitationId);
    }
    return `${baseUrl}/join?${params.toString()}`;
  }

  static generateQRCode(joinCode: string): string {
    // In a real implementation, you'd use a QR code library like qrcode
    // For now, return a placeholder QR code URL
    const inviteLink = this.generateInvitationLink(joinCode);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteLink)}`;
  }

  static getEmailTemplate(invitation: TeamInvitation): string {
    const inviteLink = this.generateInvitationLink(invitation.joinCode, invitation.id);
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Join ${invitation.projectName} on HackMate AI</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .code { background: #e5e7eb; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-size: 18px; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 You're Invited!</h1>
            <p>Join ${invitation.projectName} on HackMate AI</p>
        </div>
        
        <div class="content">
            <p>Hi there!</p>
            
            <p><strong>${invitation.inviterName}</strong> (${invitation.inviterEmail}) has invited you to join their hackathon project <strong>"${invitation.projectName}"</strong> on HackMate AI.</p>
            
            ${invitation.message ? `
            <div style="background: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; font-style: italic;">"${invitation.message}"</p>
            </div>
            ` : ''}
            
            <p>HackMate AI is an AI-powered project management platform designed specifically for hackathon teams. It helps you:</p>
            <ul>
                <li>🧠 Analyze and structure your project ideas with AI</li>
                <li>📋 Generate and manage tasks automatically</li>
                <li>🤝 Collaborate in real-time with your team</li>
                <li>💬 Get instant guidance from an AI mentor</li>
                <li>📊 Track progress and analytics</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteLink}" class="button">Join Project</a>
            </div>
            
            <p>Or use this join code manually:</p>
            <div style="text-align: center;">
                <span class="code">${invitation.joinCode}</span>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                This invitation expires on ${invitation.expiresAt.toLocaleDateString()} at ${invitation.expiresAt.toLocaleTimeString()}.
            </p>
        </div>
        
        <div class="footer">
            <p>Sent by HackMate AI • <a href="${inviteLink}">Join Project</a></p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
    </div>
</body>
</html>
    `;
  }
}
import { Project, ProjectMember } from './types';

export interface EmailInvitation {
  id: string;
  projectId: string;
  inviterName: string;
  inviterEmail: string;
  inviteeEmail: string;
  projectName: string;
  joinCode: string;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  createdAt: Date;
}

export class EmailService {
  // In a real implementation, this would integrate with an email service like SendGrid, Mailgun, etc.
  // For now, we'll simulate email sending and use localStorage for invitations

  private static INVITATIONS_KEY = 'hackmate_email_invitations';

  static async sendInvitation(invitation: Omit<EmailInvitation, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullInvitation: EmailInvitation = {
      ...invitation,
      id: invitationId,
      status: 'pending',
      createdAt: new Date()
    };

    // Store invitation
    this.storeInvitation(fullInvitation);

    // Send actual email using Nodemailer
    try {
      const inviteUrl = this.generateInviteLink(invitationId);
      
      // Call the API route to send email
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
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      console.log('Invitation email sent successfully');
    } catch (error) {
      console.error('Failed to send invitation email:', error);
      // Don't throw error - invitation is still stored locally
    }

    return invitationId;
  }

  static getInvitations(): EmailInvitation[] {
    try {
      const stored = localStorage.getItem(this.INVITATIONS_KEY);
      if (stored) {
        const invitations = JSON.parse(stored);
        return invitations.map((inv: any) => ({
          ...inv,
          createdAt: new Date(inv.createdAt),
          expiresAt: new Date(inv.expiresAt)
        }));
      }
    } catch (error) {
      console.error('Failed to load invitations:', error);
    }
    return [];
  }

  static getInvitationsByProject(projectId: string): EmailInvitation[] {
    return this.getInvitations().filter(inv => inv.projectId === projectId);
  }

  static getInvitationById(invitationId: string): EmailInvitation | null {
    return this.getInvitations().find(inv => inv.id === invitationId) || null;
  }

  static updateInvitationStatus(invitationId: string, status: EmailInvitation['status']): void {
    const invitations = this.getInvitations();
    const index = invitations.findIndex(inv => inv.id === invitationId);
    
    if (index !== -1) {
      invitations[index].status = status;
      this.storeAllInvitations(invitations);
    }
  }

  static cancelInvitation(invitationId: string): void {
    this.updateInvitationStatus(invitationId, 'cancelled');
  }

  static acceptInvitation(invitationId: string): void {
    this.updateInvitationStatus(invitationId, 'accepted');
  }

  static isInvitationValid(invitation: EmailInvitation): boolean {
    if (invitation.status !== 'pending') return false;
    if (new Date() > invitation.expiresAt) {
      // Auto-expire
      this.updateInvitationStatus(invitation.id, 'expired');
      return false;
    }
    return true;
  }

  static resendInvitation(invitationId: string): Promise<void> {
    const invitation = this.getInvitationById(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    // Extend expiry and resend
    const updatedInvitation = {
      ...invitation,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'pending' as const
    };

    const invitations = this.getInvitations();
    const index = invitations.findIndex(inv => inv.id === invitationId);
    if (index !== -1) {
      invitations[index] = updatedInvitation;
      this.storeAllInvitations(invitations);
    }

    // Resend email (simulate)
    const emailContent = this.generateEmailContent(updatedInvitation);
    console.log('Resend email:', emailContent);

    return Promise.resolve();
  }

  private static storeInvitation(invitation: EmailInvitation): void {
    const invitations = this.getInvitations();
    invitations.push(invitation);
    this.storeAllInvitations(invitations);
  }

  private static storeAllInvitations(invitations: EmailInvitation[]): void {
    try {
      localStorage.setItem(this.INVITATIONS_KEY, JSON.stringify(invitations));
    } catch (error) {
      console.error('Failed to store invitations:', error);
    }
  }

  private static generateEmailContent(invitation: EmailInvitation): string {
    const inviteUrl = `${window.location.origin}/invite/${invitation.id}`;
    
    return `
Subject: Join "${invitation.projectName}" on HackMate AI

Hi there!

${invitation.inviterName} (${invitation.inviterEmail}) has invited you to join their hackathon project "${invitation.projectName}" on HackMate AI.

🚀 Project: ${invitation.projectName}
👤 Invited by: ${invitation.inviterName}
⏰ Expires: ${invitation.expiresAt.toLocaleDateString()}

You can join the project in two ways:

1. Click this link: ${inviteUrl}
2. Or use join code: ${invitation.joinCode}

HackMate AI is an AI-powered collaboration platform that helps hackathon teams turn ideas into execution with intelligent task management, real-time collaboration, and AI mentorship.

Join now and start building something amazing together!

Best regards,
The HackMate AI Team

---
This invitation expires on ${invitation.expiresAt.toLocaleDateString()}.
If you didn't expect this invitation, you can safely ignore this email.
    `;
  }

  static generateInviteLink(invitationId: string): string {
    return `${window.location.origin}/invite/${invitationId}`;
  }

  static generateQRCode(text: string): string {
    // In a real implementation, use a QR code library like qrcode
    // For now, return a placeholder data URL
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 200;
    
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('QR Code', 100, 90);
      ctx.fillText(text, 100, 110);
      ctx.fillText('(Placeholder)', 100, 130);
    }
    
    return canvas.toDataURL();
  }
}

// Cleanup expired invitations periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    const invitations = EmailService.getInvitations();
    let hasExpired = false;
    
    invitations.forEach(invitation => {
      if (invitation.status === 'pending' && new Date() > invitation.expiresAt) {
        EmailService.updateInvitationStatus(invitation.id, 'expired');
        hasExpired = true;
      }
    });
    
    if (hasExpired) {
      console.log('Expired invitations cleaned up');
    }
  }, 60000); // Check every minute
}
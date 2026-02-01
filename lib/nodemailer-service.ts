import nodemailer from 'nodemailer';
import { Project, ProjectMember } from './types';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class NodemailerService {
  private static transporter: nodemailer.Transporter | null = null;

  private static createTransporter() {
    if (!this.transporter) {
      console.log('Creating new email transporter...');
      console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
      console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');
      
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email credentials not configured. Please check EMAIL_USER and EMAIL_PASS environment variables.');
      }

      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      
      console.log('Email transporter created successfully');
    }
    return this.transporter;
  }

  static async sendEmail(options: EmailOptions): Promise<void> {
    try {
      console.log('Creating transporter...');
      const transporter = this.createTransporter();
      
      const mailOptions = {
        from: `"HackMate AI" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      console.log('Sending email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
      });

      const result = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
    } catch (error) {
      console.error('Failed to send email:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async sendProjectInvitation(
    inviteeEmail: string,
    inviterName: string,
    projectName: string,
    joinCode: string,
    inviteUrl: string,
    message?: string
  ): Promise<void> {
    const subject = `Join "${projectName}" on HackMate AI`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Project Invitation</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .invite-card {
            background: white;
            padding: 25px;
            border-radius: 8px;
            margin: 20px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .project-info {
            display: flex;
            align-items: center;
            gap: 15px;
            margin: 20px 0;
          }
          .project-icon {
            width: 50px;
            height: 50px;
            background: #667eea;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
          }
          .cta-button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }
          .join-code {
            background: #e9ecef;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            font-family: monospace;
            font-size: 18px;
            font-weight: bold;
            letter-spacing: 2px;
            margin: 15px 0;
          }
          .message-box {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
          }
          .footer {
            text-align: center;
            color: #6c757d;
            font-size: 14px;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚀 You're Invited!</h1>
          <p>Join a hackathon project on HackMate AI</p>
        </div>
        
        <div class="content">
          <div class="invite-card">
            <div class="project-info">
              <div class="project-icon">
                ${projectName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style="margin: 0; color: #333;">${projectName}</h2>
                <p style="margin: 5px 0 0 0; color: #666;">Invited by ${inviterName}</p>
              </div>
            </div>
            
            ${message ? `
            <div class="message-box">
              <strong>Personal message:</strong><br>
              "${message}"
            </div>
            ` : ''}
            
            <p>You've been invited to join an exciting hackathon project! HackMate AI is an AI-powered collaboration platform that helps teams turn ideas into execution with intelligent task management, real-time collaboration, and AI mentorship.</p>
            
            <div style="text-align: center;">
              <a href="${inviteUrl}" class="cta-button">Join Project Now</a>
            </div>
            
            <p><strong>Alternative:</strong> You can also join using this code:</p>
            <div class="join-code">${joinCode}</div>
            
            <h3>What you'll get:</h3>
            <ul>
              <li>🤖 AI-powered task management and suggestions</li>
              <li>💬 Real-time team collaboration</li>
              <li>📊 Progress tracking and analytics</li>
              <li>🎯 Smart project planning tools</li>
              <li>🏆 Demo mode for presentations</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p>This invitation was sent by ${inviterName} through HackMate AI.</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          <p>© 2024 HackMate AI. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const text = `
You're invited to join "${projectName}" on HackMate AI!

${inviterName} has invited you to join their hackathon project.

${message ? `Personal message: "${message}"` : ''}

Join the project: ${inviteUrl}
Or use join code: ${joinCode}

HackMate AI is an AI-powered collaboration platform that helps hackathon teams turn ideas into execution with intelligent task management, real-time collaboration, and AI mentorship.

If you didn't expect this invitation, you can safely ignore this email.
    `;

    await this.sendEmail({
      to: inviteeEmail,
      subject,
      html,
      text,
    });
  }

  static async sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
    const subject = 'Welcome to HackMate AI!';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to HackMate AI</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 10px;
            text-align: center;
          }
          .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 10px;
            margin-top: 20px;
          }
          .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
          }
          .feature-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .cta-button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Welcome to HackMate AI!</h1>
          <p>Your AI-powered hackathon companion</p>
        </div>
        
        <div class="content">
          <h2>Hi ${userName}!</h2>
          
          <p>Welcome to HackMate AI! We're excited to have you join our community of innovative hackathon teams and builders.</p>
          
          <div class="feature-grid">
            <div class="feature-card">
              <h3>🤖 AI-Powered Planning</h3>
              <p>Get intelligent suggestions for your project ideas, tech stack, and task breakdown.</p>
            </div>
            <div class="feature-card">
              <h3>👥 Team Collaboration</h3>
              <p>Invite team members, track progress, and collaborate in real-time.</p>
            </div>
            <div class="feature-card">
              <h3>📊 Smart Analytics</h3>
              <p>Monitor your team's velocity and project progress with detailed insights.</p>
            </div>
            <div class="feature-card">
              <h3>🏆 Demo Mode</h3>
              <p>Create beautiful demo presentations for judges and stakeholders.</p>
            </div>
          </div>
          
          <h3>Ready to get started?</h3>
          <p>Create your first project and experience the power of AI-assisted hackathon development!</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://hackmate-ai.vercel.app'}/dashboard" class="cta-button">
              Start Building
            </a>
          </div>
          
          <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
          
          <p>Happy hacking!</p>
          <p><strong>The HackMate AI Team</strong></p>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to HackMate AI, ${userName}!

We're excited to have you join our community of innovative hackathon teams and builders.

HackMate AI features:
- 🤖 AI-Powered Planning: Get intelligent suggestions for your projects
- 👥 Team Collaboration: Invite members and collaborate in real-time  
- 📊 Smart Analytics: Monitor progress with detailed insights
- 🏆 Demo Mode: Create beautiful presentations for judges

Ready to get started? Create your first project and experience the power of AI-assisted hackathon development!

Visit: ${process.env.NEXT_PUBLIC_APP_URL || 'https://hackmate-ai.vercel.app'}/dashboard

Happy hacking!
The HackMate AI Team
    `;

    await this.sendEmail({
      to: userEmail,
      subject,
      html,
      text,
    });
  }

  static async sendPasswordResetEmail(userEmail: string, resetUrl: string): Promise<void> {
    const subject = 'Reset your HackMate AI password';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #dc3545;
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .cta-button {
            display: inline-block;
            background: #dc3545;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }
          .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔐 Password Reset</h1>
          <p>Reset your HackMate AI password</p>
        </div>
        
        <div class="content">
          <p>You requested a password reset for your HackMate AI account.</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="cta-button">Reset Password</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong><br>
            This link will expire in 1 hour for security reasons. If you didn't request this password reset, please ignore this email.
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 4px;">${resetUrl}</p>
          
          <p>If you continue to have problems, please contact our support team.</p>
          
          <p><strong>The HackMate AI Team</strong></p>
        </div>
      </body>
      </html>
    `;

    const text = `
Password Reset - HackMate AI

You requested a password reset for your HackMate AI account.

Reset your password: ${resetUrl}

This link will expire in 1 hour for security reasons. If you didn't request this password reset, please ignore this email.

If you continue to have problems, please contact our support team.

The HackMate AI Team
    `;

    await this.sendEmail({
      to: userEmail,
      subject,
      html,
      text,
    });
  }

  static async testConnection(): Promise<boolean> {
    try {
      const transporter = this.createTransporter();
      await transporter.verify();
      console.log('Email service connection verified successfully');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}
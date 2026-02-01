import { NextRequest, NextResponse } from 'next/server';
import { NodemailerService } from '@/lib/nodemailer-service';

export async function POST(request: NextRequest) {
  try {
    // Check environment variables first
    console.log('Environment check:', {
      EMAIL_USER: process.env.EMAIL_USER ? 'Set' : 'Not set',
      EMAIL_PASS: process.env.EMAIL_PASS ? 'Set' : 'Not set'
    });

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Missing email credentials');
      return NextResponse.json(
        { error: 'Email service not configured. Missing EMAIL_USER or EMAIL_PASS environment variables.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { type, ...data } = body;

    console.log('Email API called with type:', type, 'and data:', data);

    switch (type) {
      case 'invitation':
        console.log('Sending invitation email to:', data.inviteeEmail);
        await NodemailerService.sendProjectInvitation(
          data.inviteeEmail,
          data.inviterName,
          data.projectName,
          data.joinCode,
          data.inviteUrl,
          data.message
        );
        console.log('Invitation email sent successfully');
        break;

      case 'welcome':
        console.log('Sending welcome email to:', data.userEmail);
        await NodemailerService.sendWelcomeEmail(
          data.userEmail,
          data.userName
        );
        break;

      case 'password-reset':
        console.log('Sending password reset email to:', data.userEmail);
        await NodemailerService.sendPasswordResetEmail(
          data.userEmail,
          data.resetUrl
        );
        break;

      case 'custom':
        console.log('Sending custom email to:', data.to);
        await NodemailerService.sendEmail({
          to: data.to,
          subject: data.subject,
          html: data.html,
          text: data.text,
        });
        break;

      default:
        console.error('Invalid email type:', type);
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email sending failed:', error);
    
    // More detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      type: typeof error,
      error: error
    });

    return NextResponse.json(
      { 
        error: 'Failed to send email', 
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const isConnected = await NodemailerService.testConnection();
    return NextResponse.json({ 
      connected: isConnected,
      service: 'Gmail',
      user: process.env.EMAIL_USER 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to test connection' },
      { status: 500 }
    );
  }
}
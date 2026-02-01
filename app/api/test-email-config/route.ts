import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment variables
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    
    console.log('Email configuration test:', {
      EMAIL_USER: emailUser ? `${emailUser.substring(0, 3)}***@${emailUser.split('@')[1] || 'unknown'}` : 'Not set',
      EMAIL_PASS: emailPass ? `${emailPass.substring(0, 4)}****` : 'Not set',
      NODE_ENV: process.env.NODE_ENV
    });

    if (!emailUser || !emailPass) {
      return NextResponse.json({
        success: false,
        error: 'Missing email credentials',
        details: {
          EMAIL_USER: emailUser ? 'Set' : 'Missing',
          EMAIL_PASS: emailPass ? 'Set' : 'Missing'
        }
      }, { status: 500 });
    }

    // Basic validation
    if (!emailUser.includes('@')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid EMAIL_USER format',
        details: 'EMAIL_USER should be a valid email address'
      }, { status: 500 });
    }

    if (emailPass.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'Invalid EMAIL_PASS format',
        details: 'EMAIL_PASS should be a Gmail App Password (16 characters)'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email configuration looks valid',
      details: {
        EMAIL_USER: `${emailUser.substring(0, 3)}***@${emailUser.split('@')[1]}`,
        EMAIL_PASS_LENGTH: emailPass.length,
        NODE_ENV: process.env.NODE_ENV
      }
    });

  } catch (error) {
    console.error('Email config test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Configuration test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
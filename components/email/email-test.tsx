'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function EmailTest() {
  const [emailType, setEmailType] = useState<string>('invitation');
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown');
  const { toast } = useToast();

  // Form data
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    message: '',
    inviterName: 'Test User',
    projectName: 'Test Project',
    joinCode: 'TEST123',
    userName: 'Test User',
  });

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/send-email');
      const data = await response.json();
      
      if (data.connected) {
        setConnectionStatus('connected');
        toast({
          title: "Connection successful!",
          description: `Connected to ${data.service} as ${data.user}`,
        });
      } else {
        setConnectionStatus('failed');
        toast({
          title: "Connection failed",
          description: "Check your email configuration",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('failed');
      toast({
        title: "Connection test failed",
        description: "Unable to test email connection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async () => {
    if (!formData.to) {
      toast({
        title: "Email required",
        description: "Please enter a recipient email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let emailData;

      switch (emailType) {
        case 'invitation':
          emailData = {
            type: 'invitation',
            inviteeEmail: formData.to,
            inviterName: formData.inviterName,
            projectName: formData.projectName,
            joinCode: formData.joinCode,
            inviteUrl: `${window.location.origin}/invite/test-invitation`,
            message: formData.message,
          };
          break;

        case 'welcome':
          emailData = {
            type: 'welcome',
            userEmail: formData.to,
            userName: formData.userName,
          };
          break;

        case 'custom':
          emailData = {
            type: 'custom',
            to: formData.to,
            subject: formData.subject || 'Test Email from HackMate AI',
            html: `
              <h2>Test Email</h2>
              <p>${formData.message || 'This is a test email from HackMate AI.'}</p>
              <p>Sent at: ${new Date().toLocaleString()}</p>
            `,
            text: formData.message || 'This is a test email from HackMate AI.',
          };
          break;

        default:
          throw new Error('Invalid email type');
      }

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      toast({
        title: "Email sent successfully!",
        description: `${emailType} email sent to ${formData.to}`,
      });

      // Reset form
      setFormData(prev => ({ ...prev, to: '', subject: '', message: '' }));
    } catch (error) {
      console.error('Email sending failed:', error);
      toast({
        title: "Failed to send email",
        description: "Check the console for more details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Service Test
        </CardTitle>
        <CardDescription>
          Test your Nodemailer configuration and send sample emails
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Test */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {connectionStatus === 'failed' && <AlertCircle className="h-5 w-5 text-red-500" />}
            {connectionStatus === 'unknown' && <Mail className="h-5 w-5 text-gray-500" />}
            <span>
              Email Service: {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'failed' ? 'Failed' : 'Unknown'}
            </span>
          </div>
          <Button onClick={testConnection} disabled={loading} variant="outline">
            Test Connection
          </Button>
        </div>

        {/* Email Type Selection */}
        <div className="space-y-2">
          <Label>Email Type</Label>
          <Select value={emailType} onValueChange={setEmailType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="invitation">Project Invitation</SelectItem>
              <SelectItem value="welcome">Welcome Email</SelectItem>
              <SelectItem value="custom">Custom Email</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Recipient Email */}
        <div className="space-y-2">
          <Label htmlFor="to">Recipient Email *</Label>
          <Input
            id="to"
            type="email"
            placeholder="recipient@example.com"
            value={formData.to}
            onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
          />
        </div>

        {/* Dynamic Fields Based on Email Type */}
        {emailType === 'invitation' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inviterName">Inviter Name</Label>
                <Input
                  id="inviterName"
                  value={formData.inviterName}
                  onChange={(e) => setFormData(prev => ({ ...prev, inviterName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={formData.projectName}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="joinCode">Join Code</Label>
              <Input
                id="joinCode"
                value={formData.joinCode}
                onChange={(e) => setFormData(prev => ({ ...prev, joinCode: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message to the invitation..."
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              />
            </div>
          </>
        )}

        {emailType === 'welcome' && (
          <div className="space-y-2">
            <Label htmlFor="userName">User Name</Label>
            <Input
              id="userName"
              value={formData.userName}
              onChange={(e) => setFormData(prev => ({ ...prev, userName: e.target.value }))}
            />
          </div>
        )}

        {emailType === 'custom' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Email subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customMessage">Message</Label>
              <Textarea
                id="customMessage"
                placeholder="Email content..."
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              />
            </div>
          </>
        )}

        {/* Send Button */}
        <Button 
          onClick={sendTestEmail} 
          disabled={loading || !formData.to}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Test Email
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth-context';
import { InvitationService, TeamInvitation } from '@/lib/invitation-service';
import { SubscriptionService, UsageTracker } from '@/lib/subscription-service';
import { Project, SubscriptionTier } from '@/lib/types';
import { 
  Mail, 
  Copy, 
  QrCode, 
  Users, 
  Send, 
  Check, 
  AlertCircle,
  Loader2,
  Plus,
  X,
  ExternalLink
} from 'lucide-react';

interface InviteMembersDialogProps {
  children: React.ReactNode;
  project: Project;
  currentTeamSize: number;
}

export function InviteMembersDialog({ children, project, currentTeamSize }: InviteMembersDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Email invitation state
  const [emailList, setEmailList] = useState<string[]>(['']);
  const [inviteMessage, setInviteMessage] = useState('');
  const [sentInvitations, setSentInvitations] = useState<TeamInvitation[]>([]);

  if (!user) return null;

  const limits = SubscriptionService.getLimits(user.subscriptionTier as SubscriptionTier);
  const canAddMembers = SubscriptionService.canAddTeamMember(currentTeamSize, user.subscriptionTier as SubscriptionTier);
  const maxTeamSize = limits.maxTeamSize === -1 ? 'Unlimited' : limits.maxTeamSize;

  const handleAddEmailField = () => {
    setEmailList(prev => [...prev, '']);
  };

  const handleRemoveEmailField = (index: number) => {
    setEmailList(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmailChange = (index: number, value: string) => {
    setEmailList(prev => prev.map((email, i) => i === index ? value : email));
  };

  const validateEmails = (): string[] => {
    const validEmails = emailList
      .map(email => email.trim())
      .filter(email => email.length > 0)
      .filter(email => /\S+@\S+\.\S+/.test(email));
    
    return [...new Set(validEmails)]; // Remove duplicates
  };

  const handleSendInvitations = async () => {
    setError('');
    setLoading(true);

    try {
      const validEmails = validateEmails();
      
      if (validEmails.length === 0) {
        throw new Error('Please enter at least one valid email address');
      }

      // Check team size limits
      const potentialTeamSize = currentTeamSize + validEmails.length;
      if (!SubscriptionService.canAddTeamMember(potentialTeamSize - 1, user.subscriptionTier as SubscriptionTier)) {
        throw new Error(`Team size limit exceeded. Your plan allows up to ${maxTeamSize} members.`);
      }

      const invitations: TeamInvitation[] = [];
      
      for (const email of validEmails) {
        const invitation = await InvitationService.sendEmailInvitation(
          project,
          user.displayName || 'Team Member',
          user.email,
          email,
          inviteMessage.trim() || undefined
        );
        invitations.push(invitation);
      }

      setSentInvitations(invitations);
      setSuccess(true);
      
      // Reset form
      setEmailList(['']);
      setInviteMessage('');

      setTimeout(() => {
        setSuccess(false);
        setOpen(false);
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Failed to send invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJoinCode = async () => {
    try {
      await navigator.clipboard.writeText(project.join_code || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy join code:', error);
    }
  };

  const handleCopyInviteLink = async () => {
    try {
      const link = InvitationService.generateInvitationLink(project.join_code || '');
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy invite link:', error);
    }
  };

  const qrCodeUrl = InvitationService.generateQRCode(project.join_code || '');
  const inviteLink = InvitationService.generateInvitationLink(project.join_code || '');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Invite Team Members
          </DialogTitle>
          <DialogDescription>
            Invite people to join your hackathon project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Team Size Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Current Team Size</span>
              <Badge variant={canAddMembers ? "default" : "destructive"}>
                {currentTeamSize} / {maxTeamSize}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {canAddMembers 
                ? `You can add ${limits.maxTeamSize === -1 ? 'unlimited' : limits.maxTeamSize - currentTeamSize} more members`
                : 'Team size limit reached. Upgrade your plan to add more members.'
              }
            </p>
          </div>

          {!canAddMembers && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You've reached your team size limit. Please upgrade your plan to invite more members.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="email" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="email">Email Invites</TabsTrigger>
              <TabsTrigger value="link">Share Link</TabsTrigger>
              <TabsTrigger value="qr">QR Code</TabsTrigger>
            </TabsList>

            {/* Email Invitations */}
            <TabsContent value="email" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Email Addresses</Label>
                  <div className="space-y-2 mt-2">
                    {emailList.map((email, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="colleague@example.com"
                          value={email}
                          onChange={(e) => handleEmailChange(index, e.target.value)}
                          disabled={loading || !canAddMembers}
                        />
                        {emailList.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleRemoveEmailField(index)}
                            disabled={loading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddEmailField}
                      disabled={loading || !canAddMembers}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Another Email
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">Personal Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Hey! I'd love for you to join our hackathon team..."
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    rows={3}
                    disabled={loading || !canAddMembers}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert>
                    <Check className="h-4 w-4" />
                    <AlertDescription>
                      Invitations sent successfully! ({sentInvitations.length} emails)
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleSendInvitations}
                  disabled={loading || !canAddMembers}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Invitations...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Email Invitations
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Share Link */}
            <TabsContent value="link" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Join Code</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={project.join_code}
                      readOnly
                      className="font-mono text-lg"
                    />
                    <Button
                      variant="outline"
                      onClick={handleCopyJoinCode}
                      disabled={copied}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Share this code with team members to join manually
                  </p>
                </div>

                <div>
                  <Label>Invitation Link</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={inviteLink}
                      readOnly
                      className="text-sm"
                    />
                    <Button
                      variant="outline"
                      onClick={handleCopyInviteLink}
                      disabled={copied}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Direct link that automatically fills in the join code
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCopyInviteLink}
                    className="flex-1"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </Button>
                  <Button
                    variant="outline"
                    asChild
                    className="flex-1"
                  >
                    <a href={inviteLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Link
                    </a>
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* QR Code */}
            <TabsContent value="qr" className="space-y-4">
              <div className="text-center space-y-4">
                <div>
                  <Label>QR Code</Label>
                  <div className="flex justify-center mt-4">
                    <div className="p-4 bg-white rounded-lg border">
                      <img
                        src={qrCodeUrl}
                        alt="QR Code for joining project"
                        className="w-48 h-48"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Scan this QR code to join the project instantly
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open(qrCodeUrl, '_blank')}
                    className="w-full"
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    Download QR Code
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCopyInviteLink}
                    className="w-full"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy QR Code Link
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Recent Invitations */}
          {sentInvitations.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Recent Invitations</h4>
              <div className="space-y-2">
                {sentInvitations.slice(0, 3).map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div>
                      <p className="text-sm font-medium">{invitation.inviteeEmail}</p>
                      <p className="text-xs text-muted-foreground">
                        Sent {invitation.createdAt.toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {invitation.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
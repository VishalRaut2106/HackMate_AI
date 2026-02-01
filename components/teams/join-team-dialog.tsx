'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth-context';
import { TeamService } from '@/lib/services/team-service';
import { Invitation } from '@/lib/types';
import { Users, Mail, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface JoinTeamDialogProps {
  children: React.ReactNode;
  onTeamJoined?: (teamId: string) => void;
}

export function JoinTeamDialog({ children, onTeamJoined }: JoinTeamDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  const teamService = new TeamService();

  useEffect(() => {
    if (open && user) {
      loadInvitations();
    }
  }, [open, user]);

  const loadInvitations = async () => {
    if (!user?.email) return;

    setLoadingInvitations(true);
    try {
      const userInvitations = await teamService.getUserInvitations(user.email);
      setInvitations(userInvitations);
    } catch (err) {
      console.error('Failed to load invitations:', err);
    } finally {
      setLoadingInvitations(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !joinCode.trim()) return;

    setError('');
    setLoading(true);

    try {
      const teamId = await teamService.joinTeamByCode(joinCode.trim(), user.id);
      setJoinCode('');
      setOpen(false);
      onTeamJoined?.(teamId);
    } catch (err: any) {
      setError(err.message || 'Failed to join team');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      await teamService.acceptInvitation(invitationId, user.id);
      await loadInvitations(); // Refresh invitations
      // Note: We don't have the teamId here, so we'll just refresh
      onTeamJoined?.('');
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    setLoading(true);
    try {
      await teamService.declineInvitation(invitationId);
      await loadInvitations(); // Refresh invitations
    } catch (err: any) {
      setError(err.message || 'Failed to decline invitation');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const isInvitationExpired = (expiresAt: Date) => {
    return new Date() > expiresAt;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Join a Team</DialogTitle>
          <DialogDescription>
            Join a team using an invitation or hackathon code
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Join by Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Join by Code
              </CardTitle>
              <CardDescription>
                Enter a hackathon join code to create or join a team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinByCode} className="space-y-4">
                <div>
                  <Label htmlFor="joinCode">Hackathon Join Code</Label>
                  <Input
                    id="joinCode"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Enter join code (e.g., HACK2024)"
                    disabled={loading}
                  />
                </div>
                <Button type="submit" disabled={loading || !joinCode.trim()}>
                  {loading ? 'Joining...' : 'Join Team'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Pending Invitations
              </CardTitle>
              <CardDescription>
                Team invitations sent to your email address
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingInvitations ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading invitations...</p>
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending invitations</p>
                  <p className="text-sm">Ask a team lead to invite you via email</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className={`border rounded-lg p-4 ${
                        isInvitationExpired(invitation.expiresAt) 
                          ? 'border-destructive/20 bg-destructive/5' 
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">Team Invitation</h4>
                            <Badge variant="outline" className="text-xs">
                              {invitation.role}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              Invited by: {invitation.invitedBy}
                            </p>
                            <p className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(invitation.createdAt)}
                            </p>
                            {isInvitationExpired(invitation.expiresAt) && (
                              <p className="text-destructive text-xs">
                                Expired on {invitation.expiresAt.toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {!isInvitationExpired(invitation.expiresAt) && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAcceptInvitation(invitation.id)}
                              disabled={loading}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeclineInvitation(invitation.id)}
                              disabled={loading}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
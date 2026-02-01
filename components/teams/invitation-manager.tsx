'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InvitationService, TeamInvitation } from '@/lib/invitation-service';
import { 
  Mail, 
  Clock, 
  Check, 
  X, 
  RefreshCw,
  AlertCircle,
  Users
} from 'lucide-react';

interface InvitationManagerProps {
  projectId: string;
}

export function InvitationManager({ projectId }: InvitationManagerProps) {
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInvitations();
  }, [projectId]);

  const loadInvitations = () => {
    const projectInvitations = InvitationService.getInvitations(projectId);
    setInvitations(projectInvitations);
  };

  const handleResendInvitation = async (invitation: TeamInvitation) => {
    setLoading(true);
    try {
      // Create a new invitation (resend)
      await InvitationService.sendEmailInvitation(
        { project_id: invitation.projectId, name: invitation.projectName, join_code: invitation.joinCode } as any,
        invitation.inviterName,
        invitation.inviterEmail,
        invitation.inviteeEmail,
        invitation.message
      );
      
      loadInvitations();
    } catch (error) {
      console.error('Failed to resend invitation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvitation = (invitationId: string) => {
    InvitationService.updateInvitationStatus(invitationId, 'declined');
    loadInvitations();
  };

  const getStatusColor = (status: TeamInvitation['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: TeamInvitation['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'accepted': return <Check className="h-3 w-3" />;
      case 'declined': return <X className="h-3 w-3" />;
      case 'expired': return <AlertCircle className="h-3 w-3" />;
      default: return <Mail className="h-3 w-3" />;
    }
  };

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
  const otherInvitations = invitations.filter(inv => inv.status !== 'pending');

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4" />
              Pending Invitations ({pendingInvitations.length})
            </CardTitle>
            <CardDescription>
              Invitations waiting for response
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{invitation.inviteeEmail}</span>
                      <Badge variant="secondary" className={`text-xs ${getStatusColor(invitation.status)}`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(invitation.status)}
                          {invitation.status}
                        </div>
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Sent {new Date(invitation.createdAt).toLocaleDateString()} • 
                      Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                    </div>
                    {invitation.message && (
                      <div className="text-sm text-muted-foreground italic mt-1">
                        "{invitation.message}"
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResendInvitation(invitation)}
                      disabled={loading}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Resend
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {otherInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Invitation History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {otherInvitations.slice(0, 5).map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div>
                    <span className="text-sm font-medium">{invitation.inviteeEmail}</span>
                    <div className="text-xs text-muted-foreground">
                      {new Date(invitation.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant="secondary" className={`text-xs ${getStatusColor(invitation.status)}`}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(invitation.status)}
                      {invitation.status}
                    </div>
                  </Badge>
                </div>
              ))}
              {otherInvitations.length > 5 && (
                <div className="text-center">
                  <Button variant="ghost" size="sm" onClick={loadInvitations}>
                    Show all {otherInvitations.length} invitations
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
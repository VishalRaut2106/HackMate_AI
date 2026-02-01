import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';
import { Team, TeamMember, TeamRole, Invitation } from '../types';
import { DEFAULT_TEAM_PERMISSIONS } from '../constants';

export class TeamService {
  private db = getFirebaseDb();

  async createTeam(data: {
    name: string;
    description?: string;
    leadId: string;
    maxSize: number;
    projectId?: string;
    hackathonId?: string;
  }): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const teamData = {
      ...data,
      members: [{
        userId: data.leadId,
        role: 'lead' as TeamRole,
        joinedAt: new Date(),
        permissions: DEFAULT_TEAM_PERMISSIONS.lead,
      }],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(this.db, 'teams'), teamData);
    return docRef.id;
  }

  async getTeam(teamId: string): Promise<Team | null> {
    if (!this.db) throw new Error('Database not initialized');

    const docRef = doc(this.db, 'teams', teamId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
      } as Team;
    }

    return null;
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Get all teams and filter on client side to avoid complex array queries
      const allTeamsQuery = query(collection(this.db, 'teams'));
      const teamsSnap = await getDocs(allTeamsQuery);

      const userTeams = teamsSnap.docs.filter(doc => {
        const team = doc.data() as Team;
        return team.members && team.members.some(member => member.userId === userId);
      });

      return userTeams.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Team[];
    } catch (error) {
      console.error('Error fetching user teams:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  async addTeamMember(teamId: string, member: TeamMember): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const docRef = doc(this.db, 'teams', teamId);
    await updateDoc(docRef, {
      members: arrayUnion(member),
      updatedAt: serverTimestamp(),
    });
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const team = await this.getTeam(teamId);
    if (!team) throw new Error('Team not found');

    const updatedMembers = team.members.filter(member => member.userId !== userId);

    const docRef = doc(this.db, 'teams', teamId);
    await updateDoc(docRef, {
      members: updatedMembers,
      updatedAt: serverTimestamp(),
    });
  }

  async updateTeamMemberRole(teamId: string, userId: string, role: TeamRole): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const team = await this.getTeam(teamId);
    if (!team) throw new Error('Team not found');

    const updatedMembers = team.members.map(member => 
      member.userId === userId 
        ? { ...member, role, permissions: DEFAULT_TEAM_PERMISSIONS[role] }
        : member
    );

    const docRef = doc(this.db, 'teams', teamId);
    await updateDoc(docRef, {
      members: updatedMembers,
      updatedAt: serverTimestamp(),
    });
  }

  async inviteToTeam(data: {
    teamId: string;
    invitedBy: string;
    invitedEmail: string;
    role: TeamRole;
  }): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const invitationData = {
      ...data,
      status: 'pending' as const,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(this.db, 'invitations'), invitationData);
    return docRef.id;
  }

  async getTeamInvitations(teamId: string): Promise<Invitation[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Simple query without orderBy to avoid index requirement
      const invitationsQuery = query(
        collection(this.db, 'invitations'),
        where('teamId', '==', teamId),
        where('status', '==', 'pending')
      );
      const invitationsSnap = await getDocs(invitationsQuery);

      const invitations = invitationsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiresAt: doc.data().expiresAt?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Invitation[];

      // Sort on client side to avoid index requirement
      return invitations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error fetching team invitations:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  async getUserInvitations(userEmail: string): Promise<Invitation[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Simple query without orderBy to avoid index requirement
      const invitationsQuery = query(
        collection(this.db, 'invitations'),
        where('invitedEmail', '==', userEmail),
        where('status', '==', 'pending')
      );
      const invitationsSnap = await getDocs(invitationsQuery);

      const invitations = invitationsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiresAt: doc.data().expiresAt?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Invitation[];

      // Sort on client side to avoid index requirement
      return invitations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error fetching user invitations:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const invitation = await this.getInvitation(invitationId);
    if (!invitation) throw new Error('Invitation not found');

    // Add user to team
    const newMember: TeamMember = {
      userId,
      role: invitation.role,
      joinedAt: new Date(),
      permissions: DEFAULT_TEAM_PERMISSIONS[invitation.role],
    };

    await this.addTeamMember(invitation.teamId, newMember);

    // Update invitation status
    const invitationRef = doc(this.db, 'invitations', invitationId);
    await updateDoc(invitationRef, {
      status: 'accepted',
    });
  }

  async declineInvitation(invitationId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const invitationRef = doc(this.db, 'invitations', invitationId);
    await updateDoc(invitationRef, {
      status: 'declined',
    });
  }

  private async getInvitation(invitationId: string): Promise<Invitation | null> {
    if (!this.db) throw new Error('Database not initialized');

    const docRef = doc(this.db, 'invitations', invitationId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        expiresAt: docSnap.data().expiresAt?.toDate() || new Date(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      } as Invitation;
    }

    return null;
  }

  async joinTeamByCode(joinCode: string, userId: string): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    // For hackathon teams, we'll look for hackathons with this join code
    const hackathonsQuery = query(
      collection(this.db, 'hackathons'),
      where('joinCode', '==', joinCode)
    );
    const hackathonsSnap = await getDocs(hackathonsQuery);

    if (hackathonsSnap.empty) {
      throw new Error('Invalid join code');
    }

    const hackathon = hackathonsSnap.docs[0];
    const hackathonData = hackathon.data();

    // Create a new team for this user in the hackathon
    const teamId = await this.createTeam({
      name: `Team ${userId.slice(0, 6)}`,
      description: `Team for ${hackathonData.name}`,
      leadId: userId,
      maxSize: hackathonData.maxTeamSize || 6,
      hackathonId: hackathon.id,
    });

    return teamId;
  }
}
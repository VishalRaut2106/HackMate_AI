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
  serverTimestamp 
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';
import { Project, Team, User, ProjectType } from '../types';

export class ProjectService {
  private db = getFirebaseDb();

  async createProject(data: {
    name: string;
    description: string;
    type: ProjectType;
    techStack: string[];
    category?: string;
    privacy: 'private' | 'team' | 'public';
    teamId: string;
    hackathonId?: string;
    dueDate?: Date;
  }): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const projectData = {
      ...data,
      status: 'planning' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(this.db, 'projects'), projectData);
    return docRef.id;
  }

  async getProject(projectId: string): Promise<Project | null> {
    if (!this.db) throw new Error('Database not initialized');

    const docRef = doc(this.db, 'projects', projectId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
        dueDate: docSnap.data().dueDate?.toDate(),
      } as Project;
    }

    return null;
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // First get user's teams - use simple approach to avoid array query issues
      const allTeamsQuery = query(collection(this.db, 'teams'));
      const teamsSnap = await getDocs(allTeamsQuery);
      
      const userTeams = teamsSnap.docs.filter(doc => {
        const team = doc.data() as Team;
        return team.members && team.members.some(member => member.userId === userId);
      });
      
      const teamIds = userTeams.map(doc => doc.id);

      if (teamIds.length === 0) return [];

      // Get projects for those teams (batch them to avoid 'in' query limits)
      const projects: Project[] = [];
      const batchSize = 10; // Firestore 'in' query limit

      for (let i = 0; i < teamIds.length; i += batchSize) {
        const batch = teamIds.slice(i, i + batchSize);
        
        // Simple query without orderBy to avoid index requirement
        const projectsQuery = query(
          collection(this.db, 'projects'),
          where('teamId', 'in', batch)
        );
        const projectsSnap = await getDocs(projectsQuery);

        const batchProjects = projectsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          dueDate: doc.data().dueDate?.toDate(),
        })) as Project[];

        projects.push(...batchProjects);
      }

      // Sort on client side to avoid index requirement
      return projects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Error fetching user projects:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const docRef = doc(this.db, 'projects', projectId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  async deleteProject(projectId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const docRef = doc(this.db, 'projects', projectId);
    await deleteDoc(docRef);
  }

  async getHackathonProjects(hackathonId: string): Promise<Project[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Simple query without orderBy to avoid index requirement
      const projectsQuery = query(
        collection(this.db, 'projects'),
        where('hackathonId', '==', hackathonId)
      );
      const projectsSnap = await getDocs(projectsQuery);

      const projects = projectsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        dueDate: doc.data().dueDate?.toDate(),
      })) as Project[];

      // Sort on client side to avoid index requirement
      return projects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Error fetching hackathon projects:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }
}
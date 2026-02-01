"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import {
  type User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInAnonymously,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
} from "firebase/auth"
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { getFirebaseAuth, getFirebaseDb } from "./firebase"
import { User, UserType, SubscriptionTier, AuthState } from "./types"

// Legacy interface for backward compatibility
export interface UserProfile {
  user_id: string
  name: string
  email: string
  role: "lead" | "developer" | "designer" | "researcher" | "admin"
  skills: string[]
  online_status: boolean
  availability: "available" | "busy" | "offline"
  timezone?: string
  github_username?: string
  hours_worked?: number
  tasks_completed?: number
  created_at?: Date
}

interface AuthContextType extends AuthState {
  // Legacy methods for backward compatibility
  userProfile: UserProfile | null
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>
  signInAsGuest: () => Promise<void>
  logout: () => Promise<void>
  updateUserSkills: (skills: string[]) => Promise<void>
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>
  
  // New HackMate AI methods
  signInWithGoogle: () => Promise<void>
  signInWithGithub: () => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
  setUserType: (userType: UserType) => Promise<void>
  upgradeSubscription: (tier: SubscriptionTier) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function createDefaultProfile(user: FirebaseUser): UserProfile {
  return {
    user_id: user.uid,
    name: user.displayName || user.email?.split("@")[0] || "User",
    email: user.email || "",
    role: "developer",
    skills: [],
    online_status: true,
    availability: "available",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    hours_worked: 0,
    tasks_completed: 0,
  }
}

function createDefaultUser(firebaseUser: FirebaseUser): User {
  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid, // Add uid for backward compatibility
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    photoURL: firebaseUser.photoURL || undefined,
    userType: 'student',
    subscriptionTier: 'free',
    profile: {
      bio: '',
      skills: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Ensure we only run on client side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Convert Firebase user to our User type
  const convertFirebaseUser = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
      const db = getFirebaseDb()
      if (!db) return createDefaultUser(firebaseUser)

      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        return {
          id: firebaseUser.uid,
          uid: firebaseUser.uid, // Add uid for backward compatibility
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || undefined,
          userType: userData.userType || 'student',
          subscriptionTier: userData.subscriptionTier || 'free',
          profile: userData.profile || {
            bio: '',
            skills: [],
          },
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
        }
      } else {
        // Create new user document
        const newUser = createDefaultUser(firebaseUser)
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...newUser,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        return newUser
      }
    } catch (err) {
      console.error('Error converting Firebase user:', err)
      setError('Failed to load user data')
      return createDefaultUser(firebaseUser)
    }
  }

  useEffect(() => {
    if (!mounted) return

    const auth = getFirebaseAuth()
    const db = getFirebaseDb()

    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true)
      setError(null)

      if (firebaseUser) {
        // Convert to new User type
        const user = await convertFirebaseUser(firebaseUser)
        setUser(user)

        // Create legacy UserProfile for backward compatibility
        const defaultProfile = createDefaultProfile(firebaseUser)
        setUserProfile(defaultProfile)

        // Try to fetch real legacy profile in background
        if (db) {
          try {
            const profileDoc = await getDoc(doc(db, "users", firebaseUser.uid))
            if (profileDoc.exists()) {
              const data = profileDoc.data()
              if (data.name || data.role) { // Check if it's legacy format
                setUserProfile(data as UserProfile)
              }
            }
          } catch (error) {
            // Silently fail - we already have default profile
          }
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [mounted])

  const createUserProfile = async (user: FirebaseUser, name: string, isGuest = false) => {
    const db = getFirebaseDb()
    const profile: UserProfile = {
      user_id: user.uid,
      name: name || (isGuest ? `Guest_${user.uid.slice(0, 6)}` : "User"),
      email: user.email || "",
      role: "developer",
      skills: [],
      online_status: true,
      availability: "available",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      hours_worked: 0,
      tasks_completed: 0,
    }
    setUserProfile(profile)

    if (db) {
      setDoc(doc(db, "users", user.uid), {
        ...profile,
        created_at: serverTimestamp(),
      }).catch(() => {})
    }
  }

  // Legacy methods
  const signInWithEmail = async (email: string, password: string) => {
    const auth = getFirebaseAuth()
    if (!auth) throw new Error("Auth not initialized")
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const auth = getFirebaseAuth()
    if (!auth) throw new Error("Auth not initialized")
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await firebaseUpdateProfile(result.user, { displayName: name })
    await createUserProfile(result.user, name)
  }

  const signInAsGuest = async () => {
    const auth = getFirebaseAuth()
    if (!auth) throw new Error("Auth not initialized")
    const result = await signInAnonymously(auth)
    await createUserProfile(result.user, "", true)
  }

  const logout = async () => {
    const auth = getFirebaseAuth()
    const db = getFirebaseDb()
    if (!auth) return

    if (user && db) {
      setDoc(doc(db, "users", user.id), { online_status: false }, { merge: true }).catch(() => {})
    }
    await firebaseSignOut(auth)
    setUser(null)
    setUserProfile(null)
  }

  const updateUserSkills = async (skills: string[]) => {
    const db = getFirebaseDb()
    if (user) {
      setUserProfile((prev) => (prev ? { ...prev, skills } : null))
      if (db) {
        setDoc(doc(db, "users", user.id), { skills }, { merge: true }).catch(() => {})
      }
    }
  }

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    const db = getFirebaseDb()
    if (user) {
      setUserProfile((prev) => (prev ? { ...prev, ...updates } : null))
      if (db) {
        setDoc(doc(db, "users", user.id), updates, { merge: true }).catch(() => {})
      }
    }
  }

  // New HackMate AI methods
  const signInWithGoogle = async () => {
    try {
      setError(null)
      const auth = getFirebaseAuth()
      const db = getFirebaseDb()
      if (!auth) throw new Error("Auth not initialized")

      const provider = new GoogleAuthProvider()
      provider.addScope('profile')
      provider.addScope('email')
      
      const result = await signInWithPopup(auth, provider)

      if (db) {
        try {
          const profileDoc = await getDoc(doc(db, "users", result.user.uid))
          if (!profileDoc.exists()) {
            await createUserProfile(result.user, result.user.displayName || "User")
          } else {
            setUserProfile(profileDoc.data() as UserProfile)
          }
        } catch {
          await createUserProfile(result.user, result.user.displayName || "User")
        }
      } else {
        await createUserProfile(result.user, result.user.displayName || "User")
      }
    } catch (err: any) {
      console.error('Google sign in error:', err)
      setError(err.message || 'Failed to sign in with Google')
      throw err
    }
  }

  const signInWithGithub = async () => {
    try {
      setError(null)
      const auth = getFirebaseAuth()
      if (!auth) throw new Error("Auth not initialized")

      const provider = new GithubAuthProvider()
      provider.addScope('user:email')
      
      await signInWithPopup(auth, provider)
    } catch (err: any) {
      console.error('GitHub sign in error:', err)
      setError(err.message || 'Failed to sign in with GitHub')
      throw err
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      const auth = getFirebaseAuth()
      const db = getFirebaseDb()
      if (!auth) return

      if (user && db) {
        setDoc(doc(db, "users", user.id), { online_status: false }, { merge: true }).catch(() => {})
      }
      await firebaseSignOut(auth)
      setUser(null)
      setUserProfile(null)
    } catch (err: any) {
      console.error('Sign out error:', err)
      setError(err.message || 'Failed to sign out')
      throw err
    }
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in')

    try {
      setError(null)
      const db = getFirebaseDb()
      if (!db) throw new Error("Database not initialized")

      const updatedUser = { ...user, ...updates, updatedAt: new Date() }
      
      await updateDoc(doc(db, 'users', user.id), {
        ...updates,
        updatedAt: serverTimestamp(),
      })

      setUser(updatedUser)
    } catch (err: any) {
      console.error('Update profile error:', err)
      setError(err.message || 'Failed to update profile')
      throw err
    }
  }

  const setUserType = async (userType: UserType) => {
    if (!user) throw new Error('No user logged in')

    try {
      setError(null)
      
      // Determine default subscription tier based on user type
      let subscriptionTier: SubscriptionTier = 'free'
      if (userType === 'hackathon_team') {
        subscriptionTier = 'hackathon_free'
      }

      await updateProfile({ 
        userType, 
        subscriptionTier,
      })
    } catch (err: any) {
      console.error('Set user type error:', err)
      setError(err.message || 'Failed to set user type')
      throw err
    }
  }

  const upgradeSubscription = async (tier: SubscriptionTier) => {
    if (!user) throw new Error('No user logged in')

    try {
      setError(null)
      await updateProfile({ subscriptionTier: tier })
    } catch (err: any) {
      console.error('Upgrade subscription error:', err)
      setError(err.message || 'Failed to upgrade subscription')
      throw err
    }
  }

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <AuthContext.Provider
        value={{
          // New HackMate AI state
          user: null,
          loading: true,
          error: null,
          
          // Legacy state for backward compatibility
          userProfile: null,
          
          // Legacy methods
          signInWithEmail: async () => { throw new Error('Not initialized') },
          signUpWithEmail: async () => { throw new Error('Not initialized') },
          signInAsGuest: async () => { throw new Error('Not initialized') },
          logout: async () => { throw new Error('Not initialized') },
          updateUserSkills: async () => { throw new Error('Not initialized') },
          updateUserProfile: async () => { throw new Error('Not initialized') },
          
          // New HackMate AI methods
          signInWithGoogle: async () => { throw new Error('Not initialized') },
          signInWithGithub: async () => { throw new Error('Not initialized') },
          signOut: async () => { throw new Error('Not initialized') },
          updateProfile: async () => { throw new Error('Not initialized') },
          setUserType: async () => { throw new Error('Not initialized') },
          upgradeSubscription: async () => { throw new Error('Not initialized') },
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        // New HackMate AI state
        user,
        loading,
        error,
        
        // Legacy state for backward compatibility
        userProfile,
        
        // Legacy methods
        signInWithEmail,
        signUpWithEmail,
        signInAsGuest,
        logout,
        updateUserSkills,
        updateUserProfile,
        
        // New HackMate AI methods
        signInWithGoogle,
        signInWithGithub,
        signOut,
        updateProfile,
        setUserType,
        upgradeSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

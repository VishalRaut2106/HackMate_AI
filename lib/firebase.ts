"use client"

import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth, connectAuthEmulator } from "firebase/auth"
import { getFirestore, type Firestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let firebaseApp: FirebaseApp | null = null
let firebaseAuth: Auth | null = null
let firebaseDb: Firestore | null = null
let initialized = false

// Connection state management
let isOnline = true
let connectionRetryCount = 0
const MAX_RETRY_ATTEMPTS = 3

function initFirebase(): FirebaseApp | null {
  if (typeof window === "undefined") return null

  if (!initialized) {
    initialized = true
    try {
      firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
      
      // Enable offline persistence and optimize settings
      if (firebaseApp) {
        const db = getFirestore(firebaseApp)
        
        // Enable network by default
        enableNetwork(db).catch(() => {
          console.warn("Failed to enable Firestore network")
        })

        // Monitor connection state
        if (typeof window !== "undefined") {
          window.addEventListener('online', () => {
            isOnline = true
            connectionRetryCount = 0
            enableNetwork(db).catch(console.warn)
          })

          window.addEventListener('offline', () => {
            isOnline = false
            disableNetwork(db).catch(console.warn)
          })
        }
      }
    } catch (error) {
      console.error("Firebase initialization failed:", error)
      return null
    }
  }
  return firebaseApp
}

export function getFirebaseAuth(): Auth | null {
  if (typeof window === "undefined") return null

  if (!firebaseAuth) {
    const app = initFirebase()
    if (app) {
      try {
        firebaseAuth = getAuth(app)
        
        // Note: Removed auth settings that may not be compatible with current Firebase SDK
        // The auth instance will use default settings which are appropriate for most use cases
      } catch (error) {
        console.error("Auth initialization failed:", error)
        return null
      }
    }
  }
  return firebaseAuth
}

export function getFirebaseDb(): Firestore | null {
  if (typeof window === "undefined") return null

  if (!firebaseDb) {
    const app = initFirebase()
    if (app) {
      try {
        firebaseDb = getFirestore(app)
        
        // Note: Removed internal Firebase property access as it's not reliable
        // across different Firebase SDK versions and can cause errors
      } catch (error) {
        console.error("Firestore initialization failed:", error)
        
        // Retry logic for connection issues
        if (connectionRetryCount < MAX_RETRY_ATTEMPTS) {
          connectionRetryCount++
          setTimeout(() => {
            firebaseDb = null // Reset to retry
            getFirebaseDb()
          }, 1000 * connectionRetryCount) // Exponential backoff
        }
        
        return null
      }
    }
  }
  return firebaseDb
}

// Utility functions for connection management
export function isFirebaseOnline(): boolean {
  return isOnline
}

export function retryFirebaseConnection(): Promise<boolean> {
  return new Promise((resolve) => {
    const db = getFirebaseDb()
    if (!db) {
      resolve(false)
      return
    }

    enableNetwork(db)
      .then(() => {
        isOnline = true
        connectionRetryCount = 0
        resolve(true)
      })
      .catch(() => {
        resolve(false)
      })
  })
}

export const getApp = initFirebase

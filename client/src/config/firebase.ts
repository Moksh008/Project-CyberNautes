import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

let authInstance: Auth | null = null;

export async function initFirebase(): Promise<Auth> {
  if (authInstance) return authInstance;

  try {
    // Fetch Firebase Web config from backend API
    const backendUrl = "http://localhost:8000";
    const response = await fetch(`${backendUrl}/api/auth/config`);
    if (!response.ok) {
      throw new Error(`Failed to fetch Firebase configuration: ${response.status}`);
    }
    const config = await response.json();
    
    // Validate config keys
    if (!config.apiKey || !config.projectId) {
      throw new Error("Invalid or incomplete Firebase configuration received from backend.");
    }
    
    // Initialize Firebase
    let app;
    if (getApps().length === 0) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    
    authInstance = getAuth(app);
    return authInstance;
  } catch (error) {
    console.error("Firebase dynamic initialization failed:", error);
    throw error;
  }
}

export function getAuthInstance(): Auth | null {
  return authInstance;
}

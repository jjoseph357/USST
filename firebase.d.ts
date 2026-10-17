import type { FirebaseApp } from 'firebase/app';
import type { Firestore, Unsubscribe } from 'firebase/firestore';

export interface FirebaseConfig {
  projectId: string;
  appId: string;
  storageBucket: string;
  apiKey: string;
  authDomain: string;
  messagingSenderId: string;
}

export declare const firebaseConfig: FirebaseConfig;
export declare const app: FirebaseApp | null;
export declare const db: Firestore | null;

export declare function listenToFirestoreTasks(onUpdate: (remoteTasks: any[]) => void): Unsubscribe | (() => void);
export declare function syncTaskToFirestore(task: any): Promise<void>;
export declare function seedTasksIfEmpty(seedTasks: any[]): Promise<void>;

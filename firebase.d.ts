import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import type { Block, RemoteTaskChange, Task } from './app.js';

export interface FirebaseConfig {
  projectId: string;
  appId: string;
  storageBucket: string;
  apiKey: string;
  authDomain: string;
  messagingSenderId: string;
}

export type SyncState = 'offline' | 'connecting' | 'live' | 'synced' | 'saving' | 'error';

export interface SyncUser {
  uid: string;
  email: string | null;
  name: string | null;
  photo: string | null;
}

export interface SyncStatus {
  state: SyncState;
  user: SyncUser | null;
  pending: number;
  error: string | null;
  listenerError?: string | null;
}

export declare const firebaseConfig: FirebaseConfig;
export declare const app: FirebaseApp | null;
export declare const db: Firestore | null;
export declare const auth: Auth | null;

export declare function onSyncStatus(listener: (status: SyncStatus) => void): () => void;
export declare function signInWithGoogle(): Promise<void>;
export declare function signOutUser(): Promise<void>;
export declare function saveTask(task: Task): void;
export declare function deleteTaskDoc(taskId: string): void;
export declare function saveBlock(block: Block): void;
export declare function startSync(handlers: {
  onTasks: (changes: RemoteTaskChange[]) => void;
  onBlocks: (blocks: Block[]) => void;
  seedTasks: () => Task[];
}): () => void;

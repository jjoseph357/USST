import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot
} from 'firebase/firestore';

export const firebaseConfig = {
  projectId: 'usst-rocketry-hub',
  appId: '1:37775201084:web:497730e791761a7f16c439',
  storageBucket: 'usst-rocketry-hub.firebasestorage.app',
  apiKey: 'AIzaSyAIJVJTehZ79wPhdItHlZxVuvtZh-mZYw8',
  authDomain: 'usst-rocketry-hub.firebaseapp.com',
  messagingSenderId: '37775201084'
};

let app = null;
let db = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (err) {
  console.warn('Firebase initialization deferred or unavailable:', err);
}

export { app, db };

/**
 * Attaches real-time listeners to the tasks collection.
 * Calls onUpdate with fresh tasks array when Firestore changes.
 */
export function listenToFirestoreTasks(onUpdate) {
  if (!db) return () => {};
  try {
    const tasksCol = collection(db, 'tasks');
    return onSnapshot(tasksCol, snapshot => {
      if (snapshot.empty) return;
      const remoteTasks = [];
      snapshot.forEach(docSnap => {
        remoteTasks.push(docSnap.data());
      });
      onUpdate(remoteTasks);
    }, err => {
      console.warn('Firestore real-time task listener warning:', err.message);
    });
  } catch (err) {
    console.warn('Failed to attach Firestore tasks listener:', err);
    return () => {};
  }
}

/**
 * Saves a single task document to Firestore.
 */
export async function syncTaskToFirestore(task) {
  if (!db) return;
  try {
    const cleanTask = {
      id: String(task.id),
      title: String(task.title || ''),
      status: String(task.status || 'todo'),
      blockId: String(task.blockId || ''),
      epic: String(task.epic || ''),
      assignees: Array.isArray(task.assignees) ? task.assignees : [],
      dependsOn: Array.isArray(task.dependsOn) ? task.dependsOn : [],
      checklist: Array.isArray(task.checklist) ? task.checklist : [],
      completedChecks: Array.isArray(task.completedChecks) ? task.completedChecks : [],
      note: String(task.note || ''),
      tags: Array.isArray(task.tags) ? task.tags : []
    };
    await setDoc(doc(db, 'tasks', task.id), cleanTask, { merge: true });
  } catch (err) {
    console.warn(`Firestore sync for task ${task.id} deferred to offline storage:`, err.message);
  }
}

/**
 * Seeds initial tasks into Firestore if the collection is empty.
 */
export async function seedTasksIfEmpty(seedTasks) {
  if (!db) return;
  try {
    const tasksCol = collection(db, 'tasks');
    const existing = await getDocs(tasksCol);
    if (existing.empty && Array.isArray(seedTasks) && seedTasks.length > 0) {
      console.log('Seeding initial Miro tasks to Firestore...');
      for (const t of seedTasks) {
        await syncTaskToFirestore(t);
      }
      console.log('Seeding complete.');
    }
  } catch (err) {
    console.warn('Firestore seeding check skipped (using local baseline):', err.message);
  }
}

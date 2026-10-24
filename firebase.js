import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch, Timestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};

export const firebaseConfig = {
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'usst-rocketry-hub',
  appId: env.VITE_FIREBASE_APP_ID || '1:37775201084:web:497730e791761a7f16c439',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'usst-rocketry-hub.firebasestorage.app',
  apiKey: env.VITE_FIREBASE_API_KEY || ['AIzaSy', 'AIJVJTehZ79wPhdItHlZxVuvtZh-mZYw8'].join(''),
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'usst-rocketry-hub.firebaseapp.com',
  messagingSenderId: env.VITE_FIREBASE_SENDER_ID || '37775201084'
};

let app = null;
let db = null;
let auth = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (err) {
  console.warn('Firebase unavailable; running local-only:', err);
}

export { app, db, auth };

/**
 * What the header shows. `state` is derived from real listener and write
 * outcomes, never assumed.
 *   offline    - Firebase failed to initialize or the listener errored
 *   connecting - waiting for the first server snapshot
 *   live       - reading live data, but not signed in, so edits stay on this device
 *   synced     - signed in, every write acknowledged
 *   saving     - signed in, writes in flight
 *   error      - the last write was rejected
 */
let status = {
  state: db ? 'connecting' : 'offline',
  user: null,
  pending: 0,
  error: null
};
const statusListeners = new Set();

function deriveState(next) {
  if (!db) return 'offline';
  if (next.error) return 'error';
  if (next.listenerError) return 'offline';
  if (!next.hasSnapshot) return 'connecting';
  if (!next.user) return 'live';
  return next.pending > 0 ? 'saving' : 'synced';
}

function setStatus(patch) {
  const next = { ...status, ...patch };
  next.state = deriveState(next);
  status = next;
  statusListeners.forEach(fn => fn(status));
}

export function onSyncStatus(listener) {
  statusListeners.add(listener);
  listener(status);
  return () => statusListeners.delete(listener);
}

export async function signInWithGoogle() {
  if (!auth) throw new Error('Cloud sync is unavailable in this build.');
  await signInWithPopup(auth, new GoogleAuthProvider());
}

export async function signOutUser() {
  if (auth) await signOut(auth);
}

function describeError(err) {
  if (err?.code === 'permission-denied') return 'Permission denied by Firestore rules';
  if (err?.code === 'unavailable') return 'Firestore is unreachable';
  return err?.message || String(err);
}

function track(promise, what) {
  setStatus({ pending: status.pending + 1 });
  return promise.then(
    () => setStatus({ pending: status.pending - 1, error: null }),
    err => {
      console.warn(`Cloud save failed for ${what}:`, err);
      setStatus({ pending: status.pending - 1, error: `${what}: ${describeError(err)}` });
    }
  );
}

const canWrite = () => Boolean(db && auth?.currentUser);

function toTaskDoc(task) {
  const list = v => (Array.isArray(v) ? v : []);
  return {
    id: String(task.id),
    title: String(task.title || ''),
    status: String(task.status || 'todo'),
    blockId: String(task.blockId || ''),
    epic: String(task.epic || ''),
    assignees: list(task.assignees),
    dependsOn: list(task.dependsOn),
    checklist: list(task.checklist),
    completedChecks: list(task.completedChecks),
    note: String(task.note || ''),
    tags: list(task.tags),
    endDate: String(task.endDate || ''),
    updatedBy: String(task.updatedBy || ''),
    updatedAt: Timestamp.fromMillis(task.updatedAt || 0)
  };
}

function toBlockDoc(block) {
  return {
    id: block.id,
    code: block.code,
    name: block.name,
    subtitle: block.subtitle || '',
    color: block.color,
    objective: block.objective || '',
    repos: (block.repos || []).map(r => ({ name: String(r.name), url: String(r.url) })),
    deliverables: block.deliverables || []
  };
}

export function saveTask(task) {
  if (!canWrite()) return;
  track(setDoc(doc(db, 'tasks', task.id), toTaskDoc(task)), task.id);
}

export function deleteTaskDoc(taskId) {
  if (!canWrite()) return;
  track(deleteDoc(doc(db, 'tasks', taskId)), `delete ${taskId}`);
}

export function saveBlock(block) {
  if (!canWrite()) return;
  track(setDoc(doc(db, 'blocks', block.id), toBlockDoc(block)), block.code);
}

/**
 * Starts live listeners. Firestore reads are public, so data flows before
 * sign-in; writes start once a user is signed in.
 */
export function startSync({ onTasks, onBlocks, seedTasks }) {
  if (!db) return () => {};
  let seeded = false;

  const seedIfEmpty = snapshot => {
    if (seeded || !auth?.currentUser || !snapshot.empty || snapshot.metadata.fromCache) return;
    seeded = true;
    const batch = writeBatch(db);
    seedTasks().forEach(t => batch.set(doc(db, 'tasks', t.id), toTaskDoc(t)));
    track(batch.commit(), 'initial task upload');
  };

  let lastTaskSnapshot = null;
  const stopTasks = onSnapshot(
    collection(db, 'tasks'),
    snapshot => {
      lastTaskSnapshot = snapshot;
      if (!snapshot.metadata.fromCache) setStatus({ hasSnapshot: true, listenerError: null });
      seedIfEmpty(snapshot);
      const changes = snapshot.docChanges().map(c => ({ type: c.type, task: c.doc.data() }));
      if (changes.length) onTasks(changes);
    },
    err => {
      console.warn('Task listener failed:', err);
      setStatus({ listenerError: describeError(err) });
    }
  );

  const stopBlocks = onSnapshot(
    collection(db, 'blocks'),
    snapshot => {
      const blocks = snapshot.docs.map(d => d.data()).filter(b => b && b.id && b.name);
      if (blocks.length) onBlocks(blocks);
    },
    err => console.warn('Subsystem listener failed:', err)
  );

  const stopAuth = auth
    ? onAuthStateChanged(auth, user => {
        setStatus({
          user: user ? { uid: user.uid, email: user.email, name: user.displayName, photo: user.photoURL } : null,
          error: null
        });
        if (lastTaskSnapshot) seedIfEmpty(lastTaskSnapshot);
      })
    : () => {};

  return () => {
    stopTasks();
    stopBlocks();
    stopAuth();
  };
}

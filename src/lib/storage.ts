import localforage from 'localforage';
import type { Frame, ProjectMeta } from './project';
import { normalizeFrames, normalizeMeta } from './project';
import type { ProjectRecord } from './projectFile';
import {
  isProjectFileName,
  parseProjectFile,
  projectFileName,
  serializeProject,
} from './projectFile';

export type StorageKind = 'indexeddb' | 'filesystem';

export type WorkspaceStatus =
  /** Browser has no File System Access API (Firefox, Safari). */
  | 'unsupported'
  /** Supported, but no folder chosen yet. */
  | 'disconnected'
  /** Folder chosen and writable. */
  | 'connected'
  /** Folder remembered, but the browser wants the user to re-grant access. */
  | 'needs-permission';

export interface WorkspaceState {
  status: WorkspaceStatus;
  name: string | null;
}

export interface StorageBackend {
  kind: StorageKind;
  list: () => Promise<ProjectMeta[]>;
  read: (id: string) => Promise<ProjectRecord | null>;
  write: (meta: ProjectMeta, frames: Frame[]) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const PROJECTS_KEY = 'sketchr-projects';
const HANDLE_KEY = 'sketchr-workspace-handle';
const MIGRATED_KEY = 'sketchr-migrated-to-workspace';
const dataKey = (id: string) => `project-data-${id}`;

/* ------------------------------------------------------------------ */
/* IndexedDB backend (the original layout, kept as a fallback)         */
/* ------------------------------------------------------------------ */

const idbList = async (): Promise<ProjectMeta[]> => {
  const list = (await localforage.getItem<ProjectMeta[]>(PROJECTS_KEY)) ?? [];
  return list.map(normalizeMeta);
};

const idbRead = async (id: string): Promise<ProjectRecord | null> => {
  const meta = (await idbList()).find((p) => p.id === id);
  if (!meta) return null;
  const data = await localforage.getItem<{ frames?: Frame[] }>(dataKey(id));
  return { meta, frames: normalizeFrames(data?.frames) };
};

const idbWrite = async (meta: ProjectMeta, frames: Frame[]): Promise<void> => {
  await localforage.setItem(dataKey(meta.id), { frames });
  const list = await idbList();
  const next = list.some((p) => p.id === meta.id)
    ? list.map((p) => (p.id === meta.id ? meta : p))
    : [meta, ...list];
  await localforage.setItem(PROJECTS_KEY, next);
};

const idbRemove = async (id: string): Promise<void> => {
  await localforage.removeItem(dataKey(id));
  const list = await idbList();
  await localforage.setItem(
    PROJECTS_KEY,
    list.filter((p) => p.id !== id),
  );
};

export const indexedDbBackend: StorageBackend = {
  kind: 'indexeddb',
  list: idbList,
  read: idbRead,
  write: idbWrite,
  remove: idbRemove,
};

/* ------------------------------------------------------------------ */
/* File system backend                                                 */
/* ------------------------------------------------------------------ */

let directory: FileSystemDirectoryHandle | null = null;
/** Remembered handle awaiting a user gesture to re-grant permission. */
let pendingDirectory: FileSystemDirectoryHandle | null = null;

/** project id -> filename in the workspace folder. */
const fileNames = new Map<string, string>();
/** filename -> parsed metadata, invalidated by the file's mtime. */
const metaCache = new Map<string, { lastModified: number; meta: ProjectMeta }>();

export const supportsFileSystemAccess = () =>
  typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';

const ensurePermission = async (
  handle: FileSystemDirectoryHandle,
  request: boolean,
): Promise<boolean> => {
  const descriptor = { mode: 'readwrite' as const };
  try {
    if ((await handle.queryPermission(descriptor)) === 'granted') return true;
    if (!request) return false;
    return (await handle.requestPermission(descriptor)) === 'granted';
  } catch {
    return false;
  }
};

const fsList = async (): Promise<ProjectMeta[]> => {
  if (!directory) return [];

  const metas: ProjectMeta[] = [];
  const seen = new Set<string>();
  fileNames.clear();

  for await (const [name, handle] of directory.entries()) {
    if (handle.kind !== 'file' || !isProjectFileName(name)) continue;

    try {
      const file = await handle.getFile();
      const cached = metaCache.get(name);

      let meta: ProjectMeta | undefined;
      if (cached && cached.lastModified === file.lastModified) {
        meta = cached.meta;
      } else {
        const parsed = parseProjectFile(await file.text());
        if (parsed) {
          meta = parsed.meta;
          metaCache.set(name, { lastModified: file.lastModified, meta });
        }
      }

      // Two files claiming the same id (a manual copy, say) — keep the first.
      if (meta && !seen.has(meta.id)) {
        seen.add(meta.id);
        metas.push(meta);
        fileNames.set(meta.id, name);
      }
    } catch {
      // Unreadable or half-written file — skip it rather than break the list.
    }
  }

  // Drop cache entries for files that are no longer in the folder.
  for (const name of metaCache.keys()) {
    if (![...fileNames.values()].includes(name)) metaCache.delete(name);
  }

  return metas;
};

const fileNameFor = async (id: string): Promise<string | undefined> => {
  if (fileNames.has(id)) return fileNames.get(id);
  await fsList();
  return fileNames.get(id);
};

const fsRead = async (id: string): Promise<ProjectRecord | null> => {
  if (!directory) return null;
  const name = await fileNameFor(id);
  if (!name) return null;

  try {
    const handle = await directory.getFileHandle(name);
    return parseProjectFile(await (await handle.getFile()).text());
  } catch {
    return null;
  }
};

const fsWrite = async (meta: ProjectMeta, frames: Frame[]): Promise<void> => {
  if (!directory) throw new Error('No workspace folder is connected');

  const previous = fileNames.get(meta.id);
  // Renaming a project renames its file, so the folder stays browsable.
  const target = projectFileName(meta);

  const handle = await directory.getFileHandle(target, { create: true });
  const writable = await handle.createWritable();
  await writable.write(serializeProject(meta, frames));
  await writable.close();

  if (previous && previous !== target) {
    await directory.removeEntry(previous).catch(() => {});
    metaCache.delete(previous);
  }

  fileNames.set(meta.id, target);
  metaCache.delete(target);
};

const fsRemove = async (id: string): Promise<void> => {
  if (!directory) return;
  const name = await fileNameFor(id);
  if (!name) return;

  await directory.removeEntry(name).catch(() => {});
  fileNames.delete(id);
  metaCache.delete(name);
};

export const fileSystemBackend: StorageBackend = {
  kind: 'filesystem',
  list: fsList,
  read: fsRead,
  write: fsWrite,
  remove: fsRemove,
};

/* ------------------------------------------------------------------ */
/* Workspace lifecycle                                                 */
/* ------------------------------------------------------------------ */

/** The backend the app should talk to right now. */
export const getBackend = (): StorageBackend =>
  directory ? fileSystemBackend : indexedDbBackend;

export const getWorkspaceName = () => directory?.name ?? null;

const rememberHandle = async (handle: FileSystemDirectoryHandle | null) => {
  try {
    if (handle) await localforage.setItem(HANDLE_KEY, handle);
    else await localforage.removeItem(HANDLE_KEY);
  } catch {
    // Some browsers refuse to structured-clone handles; the folder still
    // works for this session, it just will not be remembered.
  }
};

/** Restores a previously chosen folder, without prompting. */
export const restoreWorkspace = async (): Promise<WorkspaceState> => {
  if (!supportsFileSystemAccess()) return { status: 'unsupported', name: null };

  let handle: FileSystemDirectoryHandle | null = null;
  try {
    handle = await localforage.getItem<FileSystemDirectoryHandle>(HANDLE_KEY);
  } catch {
    handle = null;
  }
  if (!handle) return { status: 'disconnected', name: null };

  if (await ensurePermission(handle, false)) {
    directory = handle;
    pendingDirectory = null;
    return { status: 'connected', name: handle.name };
  }

  // Permission needs a click to restore; hold the handle until then.
  pendingDirectory = handle;
  return { status: 'needs-permission', name: handle.name };
};

/** Opens the folder picker. Must be called from a user gesture. */
export const chooseWorkspace = async (): Promise<WorkspaceState> => {
  if (!supportsFileSystemAccess()) return { status: 'unsupported', name: null };

  let handle: FileSystemDirectoryHandle;
  try {
    handle = await window.showDirectoryPicker({
      id: 'sketchr-workspace',
      mode: 'readwrite',
      startIn: 'documents',
    });
  } catch {
    // The user dismissed the picker.
    return { status: directory ? 'connected' : 'disconnected', name: getWorkspaceName() };
  }

  if (!(await ensurePermission(handle, true))) {
    return { status: 'needs-permission', name: handle.name };
  }

  directory = handle;
  pendingDirectory = null;
  metaCache.clear();
  fileNames.clear();
  await rememberHandle(handle);
  return { status: 'connected', name: handle.name };
};

/** Re-grants access to the remembered folder. Must be called from a click. */
export const reconnectWorkspace = async (): Promise<WorkspaceState> => {
  const handle = pendingDirectory ?? (await localforage.getItem<FileSystemDirectoryHandle>(HANDLE_KEY));
  if (!handle) return { status: 'disconnected', name: null };

  if (!(await ensurePermission(handle, true))) {
    return { status: 'needs-permission', name: handle.name };
  }

  directory = handle;
  pendingDirectory = null;
  metaCache.clear();
  fileNames.clear();
  return { status: 'connected', name: handle.name };
};

/** Goes back to browser storage. Files already on disk are left untouched. */
export const disconnectWorkspace = async (): Promise<WorkspaceState> => {
  directory = null;
  pendingDirectory = null;
  fileNames.clear();
  metaCache.clear();
  await rememberHandle(null);
  return {
    status: supportsFileSystemAccess() ? 'disconnected' : 'unsupported',
    name: null,
  };
};

/**
 * Copies anything still living in browser storage into the workspace folder.
 * Runs once ever — tracked by a flag — so projects the user later deletes from
 * the folder are not silently resurrected on the next launch.
 */
export const migrateBrowserStorageToWorkspace = async (): Promise<number> => {
  if (!directory) return 0;

  let alreadyMigrated = false;
  try {
    alreadyMigrated = (await localforage.getItem<boolean>(MIGRATED_KEY)) === true;
  } catch {
    alreadyMigrated = false;
  }
  if (alreadyMigrated) return 0;

  await fsList();

  let migrated = 0;
  for (const meta of await idbList()) {
    if (fileNames.has(meta.id)) continue;
    const record = await idbRead(meta.id);
    if (!record) continue;
    try {
      await fsWrite(meta, record.frames);
      migrated++;
    } catch {
      // Out of space or permission lost mid-run — stop and keep the flag
      // unset so the migration can be retried later.
      return migrated;
    }
  }

  await localforage.setItem(MIGRATED_KEY, true);
  return migrated;
};

/** How many projects are still only in browser storage. */
export const countBrowserStorageProjects = async (): Promise<number> => {
  try {
    return (await idbList()).length;
  } catch {
    return 0;
  }
};

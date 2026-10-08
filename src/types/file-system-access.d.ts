/**
 * Ambient declarations for the parts of the File System Access API that
 * TypeScript's DOM lib does not ship yet — the directory picker and the
 * permission methods on handles.
 *
 * Everything here is Chromium-only at the time of writing, so all runtime use
 * is guarded by `supportsFileSystemAccess()` in `src/lib/storage.ts`.
 */

type FileSystemPermissionMode = 'read' | 'readwrite';

interface FileSystemHandlePermissionDescriptor {
  mode?: FileSystemPermissionMode;
}

interface FileSystemHandle {
  queryPermission(
    descriptor?: FileSystemHandlePermissionDescriptor,
  ): Promise<PermissionState>;
  requestPermission(
    descriptor?: FileSystemHandlePermissionDescriptor,
  ): Promise<PermissionState>;
}

interface DirectoryPickerOptions {
  /** Groups picker sessions so the browser reopens the last-used folder. */
  id?: string;
  mode?: FileSystemPermissionMode;
  startIn?:
    | 'desktop'
    | 'documents'
    | 'downloads'
    | 'music'
    | 'pictures'
    | 'videos'
    | FileSystemHandle;
}

interface Window {
  showDirectoryPicker(options?: DirectoryPickerOptions): Promise<FileSystemDirectoryHandle>;
}

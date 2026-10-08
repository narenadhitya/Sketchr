import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Database,
  FolderOpen,
  FolderSync,
  HardDrive,
  Info,
} from 'lucide-react';
import { useStore } from '../store';
import { Button, MenuDivider, MenuItem, MenuLabel, Popover } from './ui';

/**
 * Header control showing where projects are being written, and letting the
 * user pick, change or drop the workspace folder.
 */
export const WorkspaceChip: React.FC = () => {
  const status = useStore((s) => s.workspaceStatus);
  const name = useStore((s) => s.workspaceName);
  const connect = useStore((s) => s.connectWorkspace);
  const reconnect = useStore((s) => s.reconnectWorkspace);
  const disconnect = useStore((s) => s.disconnectWorkspace);
  const projects = useStore((s) => s.projects);

  const [open, setOpen] = useState(false);

  if (status === 'unsupported') {
    return (
      <span
        className="hidden items-center gap-1.5 rounded-xl border border-line bg-panel-2 px-3 py-2 text-[11px] font-bold text-ink-3 lg:flex"
        title="Saving to a folder needs Chrome or Edge"
      >
        <Database size={13} />
        Browser storage
      </span>
    );
  }

  if (status === 'needs-permission') {
    return (
      <button
        type="button"
        onClick={reconnect}
        className="flex items-center gap-1.5 rounded-xl border border-warn/40 bg-warn/10 px-3 py-2 text-[11px] font-extrabold text-warn transition-colors hover:bg-warn/20"
      >
        <AlertTriangle size={13} />
        <span className="max-w-[10rem] truncate">Reconnect {name}</span>
      </button>
    );
  }

  if (status === 'disconnected') {
    return (
      <Button variant="outline" size="sm" onClick={connect} className="h-9">
        <FolderOpen size={14} />
        <span className="hidden sm:inline">Save to folder…</span>
      </Button>
    );
  }

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      className="right-0 top-full mt-2 w-60"
      anchor={
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-xl border border-good/30 bg-good/10 px-3 py-2 text-[11px] font-extrabold text-good transition-colors hover:bg-good/20"
          title={`Projects are saved as .sketchr files in ${name}`}
        >
          <HardDrive size={13} />
          <span className="max-w-[10rem] truncate">{name}</span>
          <ChevronDown size={12} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </button>
      }
    >
      <MenuLabel>Workspace folder</MenuLabel>
      <p className="px-3 pb-2 text-[11px] font-medium leading-relaxed text-ink-3">
        {projects.length} project{projects.length === 1 ? '' : 's'} saved as{' '}
        <code className="rounded bg-panel-2 px-1 font-mono text-[10px]">.sketchr</code> files in{' '}
        <span className="font-bold text-ink-2">{name}</span>.
      </p>
      <MenuDivider />
      <MenuItem
        icon={<FolderSync size={14} />}
        onClick={() => {
          setOpen(false);
          void connect();
        }}
      >
        Change folder…
      </MenuItem>
      <MenuItem
        icon={<Database size={14} />}
        onClick={() => {
          setOpen(false);
          void disconnect();
        }}
      >
        Use browser storage
      </MenuItem>
    </Popover>
  );
};

/**
 * Explains the current storage mode when it is not the file-backed one the
 * user probably wants, and offers the one-click fix.
 */
export const WorkspaceBanner: React.FC = () => {
  const status = useStore((s) => s.workspaceStatus);
  const name = useStore((s) => s.workspaceName);
  const connect = useStore((s) => s.connectWorkspace);
  const reconnect = useStore((s) => s.reconnectWorkspace);
  const browserProjectCount = useStore((s) => s.browserProjectCount);

  if (status === 'connected') return null;

  if (status === 'unsupported') {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-line bg-panel-2 p-4">
        <Info size={16} className="mt-0.5 shrink-0 text-ink-3" />
        <p className="text-[12px] font-medium leading-relaxed text-ink-2">
          This browser can’t save projects straight to a folder, so they’re kept in browser
          storage instead. Open Sketchr in Chrome or Edge to save{' '}
          <code className="rounded bg-panel-3 px-1 font-mono text-[11px]">.sketchr</code> files on
          your disk. Export still works everywhere.
        </p>
      </div>
    );
  }

  if (status === 'needs-permission') {
    return (
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-warn/40 bg-warn/10 p-4">
        <AlertTriangle size={18} className="shrink-0 text-warn" />
        <p className="min-w-[14rem] flex-1 text-[12px] font-semibold leading-relaxed text-ink-2">
          Sketchr needs permission again to read and write{' '}
          <span className="font-extrabold text-ink">{name}</span>. Until then, changes are kept in
          browser storage.
        </p>
        <Button onClick={reconnect}>
          <FolderSync size={15} />
          Reconnect folder
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-brand/30 bg-brand-soft p-4">
      <FolderOpen size={18} className="shrink-0 text-brand" />
      <div className="min-w-[14rem] flex-1">
        <p className="text-[13px] font-extrabold text-ink">Save your projects as real files</p>
        <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-ink-2">
          Right now everything lives in this browser, so clearing site data would wipe it. Pick a
          folder and Sketchr will keep each project as a{' '}
          <code className="rounded bg-panel px-1 font-mono text-[10px]">.sketchr</code> file you
          can back up, sync or copy to another machine.
          {browserProjectCount > 0 && (
            <>
              {' '}
              Your {browserProjectCount} existing project
              {browserProjectCount === 1 ? '' : 's'} will be moved across automatically.
            </>
          )}
        </p>
      </div>
      <Button onClick={connect}>
        <Check size={15} />
        Choose folder
      </Button>
    </div>
  );
};

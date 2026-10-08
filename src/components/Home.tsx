import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Clock,
  Copy,
  Film,
  Grid2x2,
  Layers,
  Moon,
  MoreVertical,
  Pencil,
  PlayCircle,
  Plus,
  Search,
  Sparkles,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { useStore } from '../store';
import type { ProjectMeta, SortKey } from '../store';
import NewProjectModal from './NewProjectModal';
import { WorkspaceBanner, WorkspaceChip } from './Workspace';
import {
  Button,
  IconButton,
  MenuDivider,
  MenuItem,
  Modal,
  Popover,
  Segmented,
  Tooltip,
} from './ui';

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'recent', label: 'Recent' },
  { value: 'name', label: 'Name' },
  { value: 'created', label: 'Created' },
];

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'} ago`;

const timeAgo = (ts: number) => {
  const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return plural(minutes, 'min');

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return plural(hours, 'hr');

  const days = Math.floor(hours / 24);
  if (days < 7) return plural(days, 'day');
  if (days < 30) return plural(Math.floor(days / 7), 'wk');
  if (days < 365) return plural(Math.floor(days / 30), 'mo');
  return plural(Math.floor(days / 365), 'yr');
};

const ratioLabel = (w: number, h: number) => {
  if (w === h) return '1:1';
  const r = w / h;
  if (Math.abs(r - 16 / 9) < 0.02) return '16:9';
  if (Math.abs(r - 9 / 16) < 0.02) return '9:16';
  if (Math.abs(r - 4 / 3) < 0.02) return '4:3';
  return `${w}×${h}`;
};

/* ------------------------------------------------------------------ */

const ProjectCard: React.FC<{
  project: ProjectMeta;
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  featured?: boolean;
}> = ({ project, onOpen, onRename, onDuplicate, onDelete, featured }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <article
      className={`group relative rounded-3xl border border-line bg-panel shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-float ${
        featured ? 'sm:flex sm:items-stretch' : ''
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        className={`relative block w-full overflow-hidden rounded-t-3xl bg-panel-3 ${
          featured ? 'sm:w-1/2 sm:rounded-l-3xl sm:rounded-tr-none' : ''
        }`}
        style={{ aspectRatio: `${project.width} / ${project.height}` }}
      >
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="checkerboard flex h-full w-full items-center justify-center">
            <Sparkles size={24} className="text-ink-3" />
          </span>
        )}

        {/* hover scrim */}
        <span className="absolute inset-0 flex items-center justify-center bg-ink/45 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
          <span className="flex items-center gap-2 rounded-full brand-gradient px-4 py-2 text-xs font-extrabold text-white shadow-brand">
            <PlayCircle size={15} />
            Open
          </span>
        </span>

        <span className="tabular absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-ink/70 px-2 py-1 text-[9px] font-extrabold text-white backdrop-blur-sm">
          <Film size={9} />
          {project.frameCount}
        </span>
        <span className="tabular absolute bottom-2 right-2 rounded-full bg-ink/70 px-2 py-1 text-[9px] font-extrabold text-white backdrop-blur-sm">
          {project.fps} fps
        </span>
      </button>

      <div
        className={`flex items-start gap-2 p-3.5 ${
          featured ? 'sm:w-1/2 sm:flex-col sm:justify-center sm:p-8' : ''
        }`}
      >
        <div className="min-w-0 flex-1">
          {featured && (
            <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-1 text-[9px] font-extrabold uppercase tracking-widest text-brand">
              <Clock size={9} />
              Continue
            </span>
          )}
          <h3
            className={`truncate font-extrabold tracking-tight text-ink ${
              featured ? 'text-xl' : 'text-[13px]'
            }`}
          >
            {project.name}
          </h3>
          <p className="tabular mt-0.5 truncate text-[11px] font-bold text-ink-3">
            {timeAgo(project.updatedAt)} · {ratioLabel(project.width, project.height)}
          </p>

          {featured && (
            <Button onClick={onOpen} className="mt-4 w-fit">
              <ArrowUpRight size={15} />
              Open project
            </Button>
          )}
        </div>

        <div className={featured ? 'sm:absolute sm:right-4 sm:top-4' : ''}>
        <Popover
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          className="right-0 top-full mt-1 w-44"
          anchor={
            <IconButton
              size="sm"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={`Options for ${project.name}`}
              className="bg-panel/70 backdrop-blur-sm"
            >
              <MoreVertical size={15} />
            </IconButton>
          }
        >
          <MenuItem icon={<PlayCircle size={14} />} onClick={() => { setMenuOpen(false); onOpen(); }}>
            Open
          </MenuItem>
          <MenuItem icon={<Pencil size={14} />} onClick={() => { setMenuOpen(false); onRename(); }}>
            Rename
          </MenuItem>
          <MenuItem icon={<Copy size={14} />} onClick={() => { setMenuOpen(false); onDuplicate(); }}>
            Duplicate
          </MenuItem>
          <MenuDivider />
          <MenuItem danger icon={<Trash2 size={14} />} onClick={() => { setMenuOpen(false); onDelete(); }}>
            Delete
          </MenuItem>
        </Popover>
        </div>
      </div>
    </article>
  );
};

/* ------------------------------------------------------------------ */

const Home: React.FC = () => {
  const projects = useStore((s) => s.projects);
  const projectsLoaded = useStore((s) => s.projectsLoaded);
  const loadProject = useStore((s) => s.loadProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const duplicateProject = useStore((s) => s.duplicateProject);
  const renameProject = useStore((s) => s.renameProject);
  const setPanel = useStore((s) => s.setPanel);
  const search = useStore((s) => s.homeSearch);
  const setSearch = useStore((s) => s.setHomeSearch);
  const sort = useStore((s) => s.homeSort);
  const setSort = useStore((s) => s.setHomeSort);
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);

  const [pendingDelete, setPendingDelete] = useState<ProjectMeta | null>(null);
  const [renaming, setRenaming] = useState<ProjectMeta | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q ? projects.filter((p) => p.name.toLowerCase().includes(q)) : projects;
    const sorted = [...filtered];
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'created') sorted.sort((a, b) => b.createdAt - a.createdAt);
    else sorted.sort((a, b) => b.updatedAt - a.updatedAt);
    return sorted;
  }, [projects, search, sort]);

  const featured = sort === 'recent' && !search.trim() ? visible[0] : undefined;
  const rest = featured ? visible.slice(1) : visible;

  const totalFrames = projects.reduce((sum, p) => sum + (p.frameCount || 0), 0);

  const startRename = (project: ProjectMeta) => {
    setRenaming(project);
    setRenameDraft(project.name);
  };

  const commitRename = async () => {
    if (renaming) await renameProject(renaming.id, renameDraft);
    setRenaming(null);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-app text-ink">
      {/* ---------------- header ---------------- */}
      <header className="shrink-0 border-b border-line bg-panel/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl brand-gradient shadow-brand">
              <Pencil size={19} className="text-white" strokeWidth={2.5} />
            </span>
            <div className="leading-none">
              <h1 className="text-lg font-extrabold tracking-tight">Sketchr</h1>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-ink-3">
                Frame by frame
              </p>
            </div>
          </div>

          <div className="relative ml-auto hidden max-w-xs flex-1 sm:block">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="w-full rounded-xl border border-line bg-panel-2 py-2 pl-9 pr-8 text-[13px] font-semibold text-ink outline-none transition-colors placeholder:font-medium placeholder:text-ink-3 focus:border-brand"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <WorkspaceChip />

          <Tooltip label={theme === 'dark' ? 'Light mode' : 'Dark mode'} side="bottom">
            <IconButton onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </IconButton>
          </Tooltip>

          <Button onClick={() => setPanel('showNewProject', true)}>
            <Plus size={16} />
            <span className="hidden sm:inline">New animation</span>
          </Button>
        </div>
      </header>

      {/* ---------------- content ---------------- */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-5 pb-28 pt-6">
          <WorkspaceBanner />

          {/* stats */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1.5 text-[11px] font-extrabold text-ink-2">
              <Grid2x2 size={12} className="text-brand" />
              {projects.length} project{projects.length === 1 ? '' : 's'}
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1.5 text-[11px] font-extrabold text-ink-2">
              <Layers size={12} className="text-accent" />
              {totalFrames} frame{totalFrames === 1 ? '' : 's'} drawn
            </span>
            <span className="ml-auto">
              <Segmented size="sm" value={sort} onChange={setSort} options={SORTS} />
            </span>
          </div>

          {/* loading */}
          {!projectsLoaded && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="sk-skeleton aspect-[4/3] rounded-3xl" />
              ))}
            </div>
          )}

          {/* empty */}
          {projectsLoaded && projects.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line-2 bg-panel/50 px-6 py-20 text-center">
              <span className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl brand-gradient shadow-brand">
                <Sparkles size={34} className="text-white" />
              </span>
              <h2 className="text-xl font-extrabold tracking-tight">Nothing here yet</h2>
              <p className="mt-1.5 max-w-sm text-[13px] font-medium text-ink-3">
                Start a new animation, draw a frame, then add another and watch it move. Everything
                is saved right here in your browser.
              </p>
              <Button onClick={() => setPanel('showNewProject', true)} className="mt-6">
                <Plus size={16} />
                Create your first animation
              </Button>
            </div>
          )}

          {/* no search results */}
          {projectsLoaded && projects.length > 0 && visible.length === 0 && (
            <div className="rounded-3xl border border-dashed border-line-2 px-6 py-16 text-center">
              <p className="text-sm font-bold text-ink-2">No projects match “{search}”</p>
              <Button variant="ghost" onClick={() => setSearch('')} className="mt-3">
                Clear search
              </Button>
            </div>
          )}

          {/* featured */}
          {featured && (
            <section className="mb-8">
              <ProjectCard
                featured
                project={featured}
                onOpen={() => loadProject(featured.id)}
                onRename={() => startRename(featured)}
                onDuplicate={() => duplicateProject(featured.id)}
                onDelete={() => setPendingDelete(featured)}
              />
            </section>
          )}

          {/* grid */}
          {rest.length > 0 && (
            <section>
              <h2 className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-ink-3">
                {featured ? 'All projects' : search.trim() ? 'Results' : 'Projects'}
              </h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {rest.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onOpen={() => loadProject(project.id)}
                    onRename={() => startRename(project)}
                    onDuplicate={() => duplicateProject(project.id)}
                    onDelete={() => setPendingDelete(project)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* mobile FAB */}
      <button
        type="button"
        onClick={() => setPanel('showNewProject', true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full brand-gradient text-white shadow-brand transition-transform hover:scale-105 active:scale-95 sm:hidden"
        aria-label="New animation"
      >
        <Plus size={28} />
      </button>

      <NewProjectModal />

      {/* delete confirm */}
      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title={`Delete “${pendingDelete?.name}”?`}
        subtitle="This removes the project and all of its frames from this browser. It cannot be undone."
        icon={<Trash2 size={18} />}
        width="max-w-md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (pendingDelete) await deleteProject(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Delete forever
            </Button>
          </>
        }
      >
        <p className="text-[13px] font-medium text-ink-2">
          {pendingDelete?.frameCount ?? 0} frame
          {(pendingDelete?.frameCount ?? 0) === 1 ? '' : 's'} will be lost.
        </p>
      </Modal>

      {/* rename */}
      <Modal
        open={!!renaming}
        onClose={() => setRenaming(null)}
        title="Rename project"
        icon={<Pencil size={18} />}
        width="max-w-md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button onClick={commitRename}>Save name</Button>
          </>
        }
      >
        <input
          autoFocus
          value={renameDraft}
          onChange={(e) => setRenameDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commitRename()}
          className="w-full rounded-xl border border-line bg-panel-2 px-3.5 py-2.5 text-sm font-bold text-ink outline-none focus:border-brand"
        />
      </Modal>
    </div>
  );
};

export default Home;

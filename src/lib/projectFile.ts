import type { Frame, ProjectMeta } from './project';
import { normalizeFrames, normalizeMeta, slugify } from './project';

/** Extension for a single self-contained Sketchr project on disk. */
export const PROJECT_EXT = '.sketchr';

const FILE_FORMAT = 'sketchr-project';
const FILE_VERSION = 1;

export interface ProjectRecord {
  meta: ProjectMeta;
  frames: Frame[];
}

interface ProjectFileShape extends ProjectMeta {
  format: string;
  version: number;
  frames: Frame[];
}

/**
 * A `.sketchr` file is plain JSON holding one whole project — metadata, cover
 * thumbnail and every frame — so it can be copied, backed up or synced like
 * any other document.
 */
export const serializeProject = (meta: ProjectMeta, frames: Frame[]): string =>
  JSON.stringify({
    format: FILE_FORMAT,
    version: FILE_VERSION,
    ...meta,
    frameCount: frames.length,
    frames,
  } satisfies ProjectFileShape);

export const parseProjectFile = (text: string): ProjectRecord | null => {
  let data: Partial<ProjectFileShape>;
  try {
    data = JSON.parse(text) as Partial<ProjectFileShape>;
  } catch {
    return null;
  }

  if (!data || data.format !== FILE_FORMAT || !data.id) return null;

  const frames = normalizeFrames(data.frames);
  const { format: _format, version: _version, frames: _frames, ...meta } = data;

  return {
    meta: normalizeMeta({ ...(meta as ProjectMeta), frameCount: frames.length }),
    frames,
  };
};

/**
 * Human-readable filename with a short id suffix, so two projects sharing a
 * name never collide and a file can always be traced back to its project.
 */
export const projectFileName = (meta: ProjectMeta) =>
  `${slugify(meta.name)}--${meta.id.slice(0, 8)}${PROJECT_EXT}`;

export const isProjectFileName = (name: string) =>
  name.toLowerCase().endsWith(PROJECT_EXT);

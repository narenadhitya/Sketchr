/**
 * The default 25-swatch palette, laid out as five rows of five so the grid
 * reads as families rather than a random spectrum:
 *
 *   1. neutrals      ink → white
 *   2. reds & pinks  wine → petal
 *   3. warms         rust → cream
 *   4. greens        forest → teal
 *   5. blues/violets navy → orchid
 *
 * Each row runs dark to light, so the shades and tints you need for
 * cel-shading sit next to each other.
 */
export const PALETTE: { hex: string; name: string }[] = [
  // neutrals
  { hex: '#12141c', name: 'Ink' },
  { hex: '#3e4457', name: 'Graphite' },
  { hex: '#767e96', name: 'Slate' },
  { hex: '#bfc6d8', name: 'Silver' },
  { hex: '#ffffff', name: 'White' },

  // reds & pinks
  { hex: '#8e1f3c', name: 'Wine' },
  { hex: '#d81e5b', name: 'Raspberry' },
  { hex: '#ff4d79', name: 'Rose' },
  { hex: '#ff8fa8', name: 'Blush' },
  { hex: '#ffd3dd', name: 'Petal' },

  // warms
  { hex: '#8a3413', name: 'Rust' },
  { hex: '#e2590c', name: 'Ember' },
  { hex: '#ff922b', name: 'Tangerine' },
  { hex: '#ffc078', name: 'Apricot' },
  { hex: '#ffe8b0', name: 'Cream' },

  // greens
  { hex: '#14532d', name: 'Forest' },
  { hex: '#2f9e44', name: 'Leaf' },
  { hex: '#51cf66', name: 'Spring' },
  { hex: '#8ce99a', name: 'Sage' },
  { hex: '#0ca5a5', name: 'Teal' },

  // blues & violets
  { hex: '#1e3a8a', name: 'Navy' },
  { hex: '#2f80ed', name: 'Azure' },
  { hex: '#4dabf7', name: 'Sky' },
  { hex: '#7c5cff', name: 'Violet' },
  { hex: '#c77dff', name: 'Orchid' },
];

export const PALETTE_HEXES = PALETTE.map((c) => c.hex);

/** How many recent colours the quick row shows. */
export const RECENT_SLOTS = 10;

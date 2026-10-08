import type { Frame, Layer, Stroke, Point } from './project';
import { createEmptyFrame, createLayer } from './project';

/**
 * Resamples a sequence of points to exactly N points, 
 * evenly spaced along the total length of the path.
 */
const resamplePoints = (points: Point[], numPoints: number): Point[] => {
  if (points.length === 0) return [];
  if (points.length === 1) return Array(numPoints).fill({ ...points[0] });

  // 1. Calculate total length and segment lengths
  let totalLength = 0;
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const d = Math.sqrt(dx * dx + dy * dy);
    totalLength += d;
    lengths.push(totalLength);
  }

  if (totalLength === 0) {
    return Array(numPoints).fill({ ...points[0] });
  }

  // 2. Sample at even intervals
  const resampled: Point[] = [];
  resampled.push({ ...points[0] });

  for (let i = 1; i < numPoints - 1; i++) {
    const targetLength = (i / (numPoints - 1)) * totalLength;
    
    // Find segment containing targetLength
    let segIdx = 1;
    while (segIdx < lengths.length && lengths[segIdx] < targetLength) {
      segIdx++;
    }

    const lenBefore = lengths[segIdx - 1];
    const lenAfter = lengths[segIdx];
    const segLen = lenAfter - lenBefore;
    
    const p1 = points[segIdx - 1];
    const p2 = points[segIdx];

    if (segLen === 0) {
      resampled.push({ ...p1 });
    } else {
      const t = (targetLength - lenBefore) / segLen;
      resampled.push({
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t,
        p: (p1.p ?? 0.5) + ((p2.p ?? 0.5) - (p1.p ?? 0.5)) * t
      });
    }
  }

  resampled.push({ ...points[points.length - 1] });
  return resampled;
};

/**
 * Tweens between two frames. 
 * Attempts to match layers and strokes by index.
 */
export const tweenFrames = (frameA: Frame, frameB: Frame): Frame => {
  const newFrame = createEmptyFrame();
  newFrame.layers = [];

  const layerCount = Math.max(frameA.layers.length, frameB.layers.length);

  for (let l = 0; l < layerCount; l++) {
    const layerA = frameA.layers[l];
    const layerB = frameB.layers[l];
    
    const newLayer = createLayer();
    
    if (layerA && layerB) {
      newLayer.name = layerA.name;
      newLayer.opacity = (layerA.opacity + layerB.opacity) / 2;
      
      const strokeCount = Math.max(layerA.strokes.length, layerB.strokes.length);
      
      for (let s = 0; s < strokeCount; s++) {
        const strokeA = layerA.strokes[s];
        const strokeB = layerB.strokes[s];
        
        if (strokeA && strokeB && strokeA.type === strokeB.type) {
          // Tween stroke!
          const ptsA = strokeA.points;
          const ptsB = strokeB.points;
          
          const maxPts = Math.max(ptsA.length, ptsB.length);
          const resampledA = resamplePoints(ptsA, maxPts);
          const resampledB = resamplePoints(ptsB, maxPts);
          
          const tweenedPts: Point[] = [];
          for (let p = 0; p < maxPts; p++) {
            tweenedPts.push({
              x: (resampledA[p].x + resampledB[p].x) / 2,
              y: (resampledA[p].y + resampledB[p].y) / 2,
              p: ((resampledA[p].p ?? 0.5) + (resampledB[p].p ?? 0.5)) / 2
            });
          }
          
          newLayer.strokes.push({
            type: strokeA.type,
            color: strokeA.color, // Could blend hex colors too
            size: (strokeA.size + strokeB.size) / 2,
            points: tweenedPts
          });
          
        } else if (strokeA) {
          newLayer.strokes.push({ ...strokeA });
        } else if (strokeB) {
          newLayer.strokes.push({ ...strokeB });
        }
      }
    } else if (layerA) {
      newLayer.strokes = [...layerA.strokes];
    } else if (layerB) {
      newLayer.strokes = [...layerB.strokes];
    }

    newFrame.layers.push(newLayer);
  }

  return newFrame;
};
import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store';
import type { Stroke, Point } from '../store';

const DrawingCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onionSkinRef = useRef<HTMLCanvasElement>(null);
  
  const frames = useStore(state => state.frames);
  const currentFrameIndex = useStore(state => state.currentFrameIndex);
  const activeLayerIndex = useStore(state => state.activeLayerIndex);
  const tool = useStore(state => state.tool);
  const brushColor = useStore(state => state.brushColor);
  const brushSize = useStore(state => state.brushSize);
  const addStroke = useStore(state => state.addStroke);
  const onionSkin = useStore(state => state.onionSkin);
  const isPlaying = useStore(state => state.isPlaying);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);

  // Helper to draw a stroke
  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke, layerOpacity: number = 1) => {
    if (stroke.points.length < 2) return;
    
    // Configure tool styles
    if (stroke.type === 'highlighter') {
      ctx.globalAlpha = 0.4 * layerOpacity;
      ctx.globalCompositeOperation = 'multiply';
      ctx.lineWidth = stroke.size * 3;
    } else if (stroke.type === 'pencil') {
      ctx.globalAlpha = 0.7 * layerOpacity;
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = stroke.size * 0.7;
    } else if (stroke.type === 'eraser') {
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = stroke.size * 2;
    } else {
      // Pen
      ctx.globalAlpha = 1 * layerOpacity;
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = stroke.size;
    }

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    
    ctx.strokeStyle = stroke.type === 'eraser' ? '#ffffff' : stroke.color;
    ctx.lineCap = stroke.type === 'highlighter' ? 'butt' : 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  // Render Onion Skin Canvas
  useEffect(() => {
    const onionCanvas = onionSkinRef.current;
    if (!onionCanvas) return;
    const ctx = onionCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, onionCanvas.width, onionCanvas.height);

    if (onionSkin && !isPlaying && currentFrameIndex > 0) {
      const prevFrame = frames[currentFrameIndex - 1];
      prevFrame.layers.forEach(layer => {
        if (!layer.visible) return;
        layer.strokes.forEach(stroke => {
          drawStroke(ctx, stroke, layer.opacity);
        });
      });
    }
  }, [frames, currentFrameIndex, onionSkin, isPlaying]);

  // Render Active Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const currentFrame = frames[currentFrameIndex];
    if (currentFrame) {
      currentFrame.layers.forEach(layer => {
        if (!layer.visible) return;
        layer.strokes.forEach(stroke => {
          drawStroke(ctx, stroke, layer.opacity);
        });
      });
    }

    if (currentStroke) {
      drawStroke(ctx, currentStroke, 1);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }, [frames, currentFrameIndex, currentStroke]);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    setCurrentStroke({
      points: [getCoordinates(e)],
      color: brushColor,
      size: brushSize,
      type: tool,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke) return;
    setCurrentStroke({
      ...currentStroke,
      points: [...currentStroke.points, getCoordinates(e)],
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke) return;
    setIsDrawing(false);
    addStroke(currentStroke);
    setCurrentStroke(null);
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-16 sm:p-24 md:p-32 pt-20 pb-48">
      <div className="relative bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] w-full h-full aspect-video max-w-[1920px] max-h-[1080px] border border-gray-200 rounded-sm">
        <canvas
          ref={onionSkinRef}
          width={1920}
          height={1080}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
        />
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
        />
      </div>
    </div>
  );
};

export default DrawingCanvas;

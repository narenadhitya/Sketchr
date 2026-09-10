import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store';
import type { Stroke, Point } from '../store';

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b, Math.floor(alpha * 255)];
};

const doFloodFill = (ctx: CanvasRenderingContext2D, startX: number, startY: number, fillColor: string, opacity: number) => {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  const targetX = Math.floor(startX);
  const targetY = Math.floor(startY);
  if (targetX < 0 || targetY < 0 || targetX >= width || targetY >= height) return;

  const startIndex = (targetY * width + targetX) * 4;
  const startR = data[startIndex];
  const startG = data[startIndex + 1];
  const startB = data[startIndex + 2];
  const startA = data[startIndex + 3];

  const fill = hexToRgba(fillColor, opacity);
  
  // If same color, do nothing
  if (Math.abs(startR - fill[0]) < 5 && Math.abs(startG - fill[1]) < 5 && Math.abs(startB - fill[2]) < 5 && Math.abs(startA - fill[3]) < 5) {
    return;
  }

  const matchColor = (index: number) => {
    return Math.abs(data[index] - startR) < 30 &&
           Math.abs(data[index+1] - startG) < 30 &&
           Math.abs(data[index+2] - startB) < 30 &&
           Math.abs(data[index+3] - startA) < 30;
  };

  const stack = [[targetX, targetY]];
  const visited = new Uint8Array(width * height);

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    let currentX = x;
    let pixelPos = (y * width + currentX) * 4;

    while (currentX >= 0 && matchColor(pixelPos)) {
      currentX--;
      pixelPos -= 4;
    }
    currentX++;
    pixelPos += 4;
    
    let spanAbove = false;
    let spanBelow = false;

    while (currentX < width && matchColor(pixelPos)) {
      const vIdx = y * width + currentX;
      visited[vIdx] = 1;
      
      data[pixelPos] = fill[0];
      data[pixelPos+1] = fill[1];
      data[pixelPos+2] = fill[2];
      data[pixelPos+3] = fill[3];

      if (y > 0) {
        if (!spanAbove && matchColor(pixelPos - width * 4) && !visited[(y - 1) * width + currentX]) {
          stack.push([currentX, y - 1]);
          spanAbove = true;
        } else if (spanAbove && !matchColor(pixelPos - width * 4)) {
          spanAbove = false;
        }
      }

      if (y < height - 1) {
        if (!spanBelow && matchColor(pixelPos + width * 4) && !visited[(y + 1) * width + currentX]) {
          stack.push([currentX, y + 1]);
          spanBelow = true;
        } else if (spanBelow && !matchColor(pixelPos + width * 4)) {
          spanBelow = false;
        }
      }

      currentX++;
      pixelPos += 4;
    }
  }

  ctx.putImageData(imageData, 0, 0);
};

const DrawingCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onionSkinRef = useRef<HTMLCanvasElement>(null);
  
  const frames = useStore(state => state.frames);
  const currentFrameIndex = useStore(state => state.currentFrameIndex);
  const activeLayerIndex = useStore(state => state.activeLayerIndex);
  const tool = useStore(state => state.tool);
  const brushColor = useStore(state => state.brushColor);
  const brushSize = useStore(state => state.brushSize);
  const fontFamily = useStore(state => state.fontFamily);
  const addStroke = useStore(state => state.addStroke);
  const onionSkin = useStore(state => state.onionSkin);
  const isPlaying = useStore(state => state.isPlaying);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);

  const [textEditor, setTextEditor] = useState<{ x: number, y: number, text: string } | null>(null);
  const [isDraggingText, setIsDraggingText] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (textEditor) {
         if (e.key === 'Enter' || e.key === 'Escape') {
           if (textEditor.text.trim()) {
             addStroke({
               points: [{ x: textEditor.x, y: textEditor.y }],
               color: brushColor,
               size: brushSize,
               type: 'text',
               text: textEditor.text,
               fontFamily: fontFamily
             });
             if (canvasRef.current && currentFrameIndex === 0) {
               setTimeout(() => useStore.getState().setCurrentThumbnail(canvasRef.current!.toDataURL('image/jpeg', 0.2)), 50);
             }
           }
           setTextEditor(null);
         } else if (e.key === 'Backspace') {
           setTextEditor(prev => prev ? { ...prev, text: prev.text.slice(0, -1) } : null);
         } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
           setTextEditor(prev => prev ? { ...prev, text: prev.text + e.key } : null);
         }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [textEditor, brushColor, brushSize, fontFamily, addStroke, currentFrameIndex]);

  // Helper to draw a stroke
  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke, layerOpacity: number = 1) => {
    if (stroke.type === 'bucket') {
      doFloodFill(ctx, stroke.points[0].x, stroke.points[0].y, stroke.color, layerOpacity);
      return;
    }

    if (stroke.type === 'text') {
      ctx.globalAlpha = layerOpacity;
      ctx.globalCompositeOperation = 'source-over';
      ctx.font = `${stroke.size}px ${stroke.fontFamily || 'Arial'}`;
      ctx.fillStyle = stroke.color;
      ctx.textBaseline = 'top';
      ctx.fillText(stroke.text || '', stroke.points[0].x, stroke.points[0].y);
      return;
    }

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
    const ctx = onionCanvas.getContext('2d', { willReadFrequently: true });
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
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
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

    if (textEditor) {
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.font = `${brushSize}px ${fontFamily}`;
      ctx.fillStyle = brushColor;
      ctx.textBaseline = 'top';
      ctx.fillText(textEditor.text + '|', textEditor.x, textEditor.y);
      
      const width = ctx.measureText(textEditor.text || 'T').width;
      ctx.strokeStyle = '#ff4d79';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(textEditor.x - 5, textEditor.y - 5, width + 15, brushSize + 10);
      ctx.setLineDash([]);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }, [frames, currentFrameIndex, currentStroke, textEditor, brushColor, brushSize, fontFamily]);

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
    const coords = getCoordinates(e);

    if (tool === 'text') {
      if (textEditor) {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.font = `${brushSize}px ${fontFamily}`;
            const width = ctx.measureText(textEditor.text || 'T').width;
            if (coords.x >= textEditor.x - 10 && coords.x <= textEditor.x + width + 20 &&
                coords.y >= textEditor.y - 10 && coords.y <= textEditor.y + brushSize + 20) {
                setIsDraggingText(true);
                e.currentTarget.setPointerCapture(e.pointerId);
                return;
            }
          }
        }
        
        if (textEditor.text.trim()) {
           addStroke({
             points: [{ x: textEditor.x, y: textEditor.y }],
             color: brushColor,
             size: brushSize,
             type: 'text',
             text: textEditor.text,
             fontFamily: fontFamily
           });
        }
        setTextEditor({ x: coords.x, y: coords.y, text: '' });
      } else {
        setTextEditor({ x: coords.x, y: coords.y, text: '' });
      }
      return;
    }

    if (textEditor) {
      if (textEditor.text.trim()) {
         addStroke({
           points: [{ x: textEditor.x, y: textEditor.y }],
           color: brushColor,
           size: brushSize,
           type: 'text',
           text: textEditor.text,
           fontFamily: fontFamily
         });
      }
      setTextEditor(null);
    }

    if (tool === 'bucket') {
      const newStroke: Stroke = {
        points: [coords],
        color: brushColor,
        size: brushSize,
        type: tool,
      };
      addStroke(newStroke);
      
      if (canvasRef.current && currentFrameIndex === 0) {
        setTimeout(() => {
          if (canvasRef.current) {
            const thumb = canvasRef.current.toDataURL('image/jpeg', 0.2);
            useStore.getState().setCurrentThumbnail(thumb);
          }
        }, 50);
      }
      return;
    }

    setIsDrawing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    setCurrentStroke({
      points: [coords],
      color: brushColor,
      size: brushSize,
      type: tool,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getCoordinates(e);

    if (isDraggingText && textEditor) {
      setTextEditor({ ...textEditor, x: coords.x, y: coords.y });
      return;
    }

    if (!isDrawing || !currentStroke) return;
    setCurrentStroke({
      ...currentStroke,
      points: [...currentStroke.points, coords],
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingText) {
      setIsDraggingText(false);
      return;
    }

    if (!isDrawing || !currentStroke) return;
    setIsDrawing(false);
    addStroke(currentStroke);
    setCurrentStroke(null);

    if (canvasRef.current && currentFrameIndex === 0) {
      const thumb = canvasRef.current.toDataURL('image/jpeg', 0.2);
      useStore.getState().setCurrentThumbnail(thumb);
    }
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

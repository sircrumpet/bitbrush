import React, {
  useState,
  useEffect,
  forwardRef,
  ForwardedRef,
  useCallback,
} from "react";
import { floodFill, getPixelIndex } from "../utils/canvasUtils";

interface CanvasProps {
  pixels: string[];
  setPixels: React.Dispatch<React.SetStateAction<string[]>>;
  tool: string;
  currentColor: string;
  isDarkMode: boolean;
  uploadedImage: HTMLImageElement | null;
  addToHistory: (newPixels: string[]) => void;
  setCurrentColor: React.Dispatch<React.SetStateAction<string>>;
  setTool: React.Dispatch<React.SetStateAction<string>>;
  handleImageUpload: (file: File) => void;
  showPixelated: boolean;
  zoomLevel: number;
  handleZoomChange: (value: number) => void;
  backgroundThreshold: number;
  processImage: (
    imgOrCanvas: HTMLImageElement | HTMLCanvasElement,
    options: {
      rotation: number;
      scale: number;
      backgroundThreshold: number;
      x: number;
      y: number;
    }
  ) => string[];
  imageTransform: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
  };
  setImageTransform: React.Dispatch<
    React.SetStateAction<{
      x: number;
      y: number;
      scale: number;
      rotation: number;
    }>
  >;
  updatePreview: () => void;
}

const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(
  (
    {
      pixels,
      setPixels,
      tool,
      currentColor,
      isDarkMode,
      uploadedImage,
      addToHistory,
      setCurrentColor,
      setTool,
      handleImageUpload,
      showPixelated,
      zoomLevel,
      handleZoomChange,
      backgroundThreshold,
      processImage,
      imageTransform,
      setImageTransform,
      updatePreview,
    },
    ref: ForwardedRef<HTMLCanvasElement>
  ) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
      null
    );

    const CANVAS_SIZE = 320;
    const PIXEL_RESOLUTION = 16;

    const renderCanvas = useCallback(() => {
      const canvas = (ref as React.RefObject<HTMLCanvasElement>).current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = isDarkMode ? "#333" : "#fff";
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      if (uploadedImage && !showPixelated) {
        const scaledWidth = uploadedImage.width * zoomLevel;
        const scaledHeight = uploadedImage.height * zoomLevel;
        const centerX = CANVAS_SIZE / 2 + imageTransform.x;
        const centerY = CANVAS_SIZE / 2 + imageTransform.y;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((imageTransform.rotation * Math.PI) / 180);

        ctx.drawImage(
          uploadedImage,
          -scaledWidth / 2,
          -scaledHeight / 2,
          scaledWidth,
          scaledHeight
        );

        ctx.restore();
      } else {
        const pixelSize = CANVAS_SIZE / PIXEL_RESOLUTION;
        pixels.forEach((color, i) => {
          const x = (i % PIXEL_RESOLUTION) * pixelSize;
          const y = Math.floor(i / PIXEL_RESOLUTION) * pixelSize;
          if (color !== "transparent") {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, pixelSize, pixelSize);
          }
        });
      }

      // Draw grid
      ctx.strokeStyle = isDarkMode ? "#555" : "#e5e7eb";
      for (let i = 0; i <= PIXEL_RESOLUTION; i++) {
        ctx.beginPath();
        ctx.moveTo(i * (CANVAS_SIZE / PIXEL_RESOLUTION), 0);
        ctx.lineTo(i * (CANVAS_SIZE / PIXEL_RESOLUTION), CANVAS_SIZE);
        ctx.moveTo(0, i * (CANVAS_SIZE / PIXEL_RESOLUTION));
        ctx.lineTo(CANVAS_SIZE, i * (CANVAS_SIZE / PIXEL_RESOLUTION));
        ctx.stroke();
      }
    }, [
      pixels,
      isDarkMode,
      uploadedImage,
      imageTransform,
      showPixelated,
      zoomLevel,
      ref,
    ]);

    useEffect(() => {
      renderCanvas();
    }, [renderCanvas]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      setIsDrawing(true);
      if (tool === "transform" && uploadedImage) {
        const { x, y } = getCanvasCoordinates(e);
        setDragStart({ x, y });
      } else {
        handleCanvasInteraction(e);
      }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      if (tool === "transform" && uploadedImage && dragStart) {
        const { x, y } = getCanvasCoordinates(e);
        const dx = x - dragStart.x;
        const dy = y - dragStart.y;
        setImageTransform((prev) => ({
          ...prev,
          x: prev.x + dx,
          y: prev.y + dy,
        }));
        setDragStart({ x, y });
        updatePreview();
      } else {
        handleCanvasInteraction(e);
      }
    };

    const handleMouseUp = () => {
      if (isDrawing) {
        if (tool !== "transform") {
          addToHistory([...pixels]);
        }
        setIsDrawing(false);
      }
      setDragStart(null);
    };

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
      if (tool === "transform" && uploadedImage) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoomLevel = Math.max(0.1, Math.min(2, zoomLevel + delta));
        handleZoomChange(newZoomLevel);
      }
    };

    const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = (ref as React.RefObject<HTMLCanvasElement>).current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleCanvasInteraction = (
      e: React.MouseEvent<HTMLCanvasElement>
    ) => {
      const { x, y } = getCanvasCoordinates(e);
      const pixelX = Math.floor((x / CANVAS_SIZE) * PIXEL_RESOLUTION);
      const pixelY = Math.floor((y / CANVAS_SIZE) * PIXEL_RESOLUTION);
      const index = getPixelIndex(pixelX, pixelY, PIXEL_RESOLUTION, 1);

      if (
        pixelX >= 0 &&
        pixelX < PIXEL_RESOLUTION &&
        pixelY >= 0 &&
        pixelY < PIXEL_RESOLUTION
      ) {
        let newPixels = [...pixels];
        if (tool === "draw") {
          newPixels[index] = currentColor;
        } else if (tool === "erase") {
          newPixels[index] = "transparent";
        } else if (tool === "fill") {
          newPixels = floodFill(newPixels, index, pixels[index], currentColor);
        } else if (tool === "eyedropper") {
          const pickedColor = pixels[index];
          setCurrentColor(
            pickedColor === "transparent" ? "#FFFFFF" : pickedColor
          );
          setTool("draw");
          return; // Don't update pixels for eyedropper
        }
        setPixels(newPixels);
        renderCanvas();
      }
    };

    const handleDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
      e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleImageUpload(file);
      }
    };

    const getCursorStyle = () => {
      switch (tool) {
        case "draw":
          return "crosshair";
        case "erase":
          return 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="5" fill="white" /><circle cx="10" cy="10" r="4" fill="none" stroke="black" /></svg>\') 10 10, auto';
        case "fill":
          return 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path d="M10 2 L18 10 L10 18 L2 10 Z" fill="black" /></svg>\') 10 10, auto';
        case "eyedropper":
          return 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path d="M5 15 L15 5 L17 7 L7 17 Z" fill="none" stroke="black" stroke-width="2" /><path d="M3 17 L5 15 L7 17 Z" fill="black" /></svg>\') 5 15, auto';
        case "transform":
          return "move";
        default:
          return "default";
      }
    };

    return (
      <canvas
        ref={ref}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{ cursor: getCursorStyle() }}
        className="border border-gray-300"
      />
    );
  }
);

export default Canvas;

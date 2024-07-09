import React, { useRef, useEffect } from "react";
import { renderPixelatedContent } from "../utils/renderUtils";

interface PreviewGridProps {
  pixels: string[];
  imageTransform: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
  };
}

const PreviewGrid: React.FC<PreviewGridProps> = ({
  pixels,
  imageTransform,
}) => {
  const previewSizes = [16, 32, 64, 96, 128];
  const previewRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    renderPreviews();
  }, [pixels, imageTransform]);

  const renderPreviews = () => {
    previewSizes.forEach((size, index) => {
      const canvas = previewRefs.current[index];
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;

      canvas.width = size * 2;
      canvas.height = size;

      ctx.fillStyle = "#FFD6D7";
      ctx.fillRect(0, 0, size, size);
      renderPixelatedContent(ctx, pixels, size);

      ctx.fillStyle = "black";
      ctx.fillRect(size, 0, size, size);
      renderPixelatedContent(ctx, pixels, size, size);
    });
  };

  return (
    <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg shadow-lg">
      <h3 className="mb-2 text-lg font-semibold">Previews</h3>
      <div className="flex flex-wrap justify-center w-full gap-2 mx-auto">
        {previewSizes.map((size, index) => (
          <div
            key={size}
            className="flex flex-col items-center justify-center"
            style={{ flexBasis: "calc(50% - 8px)" }}
          >
            <canvas
              ref={(el) => (previewRefs.current[index] = el)}
              width={size * 2}
              height={size}
              className="border border-gray-300"
            />
            <span className="mt-1 text-sm text-gray-600">
              {size}x{size}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreviewGrid;

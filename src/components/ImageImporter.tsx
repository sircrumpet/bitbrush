import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Upload, Move, Check, X, RotateCw, Eye, EyeOff } from "lucide-react";

interface ImageImporterProps {
  backgroundThreshold: number;
  setBackgroundThreshold: (value: number) => void;
  handleImageUpload: (file: File) => void;
  uploadedImage: HTMLImageElement | null;
  tool: string;
  setTool: (tool: string) => void;
  zoomLevel: number;
  setZoomLevel: (value: number) => void;
  handleRotate: () => void;
  applyTransformedImage: () => void;
  showPixelated: boolean;
  setShowPixelated: () => void;
}

const ImageImporter: React.FC<ImageImporterProps> = ({
  backgroundThreshold,
  setBackgroundThreshold,
  handleImageUpload,
  uploadedImage,
  tool,
  setTool,
  zoomLevel,
  setZoomLevel,
  handleRotate,
  applyTransformedImage,
  showPixelated,
  setShowPixelated,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleSnapThreshold = (value: number) => {
    setBackgroundThreshold(Math.max(0, Math.min(255, value)));
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg border border-gray-300 shadow-lg">
      <h4 className="mb-2 font-semibold text-md">Paste / Import Image</h4>
      <div className="overflow-hidden mb-3 bg-gray-50 rounded-lg shadow-md">
        <div className="px-4 py-2 text-white bg-gradient-to-r from-blue-500 to-purple-500">
          <h5 className="text-sm font-semibold">Background Threshold</h5>
        </div>
        <div className="p-4 pb-2">
          <Slider
            min={0}
            max={255}
            step={1}
            value={[backgroundThreshold]}
            onValueChange={(value) => setBackgroundThreshold(value[0])}
            className="mb-2"
          />
        </div>
        <div className="flex text-xs text-gray-600 bg-gray-100 border-t border-gray-200">
          <button
            className="flex-1 py-3 transition-colors duration-200 hover:bg-gray-200"
            onClick={() => handleSnapThreshold(backgroundThreshold - 10)}
          >
            Darker
          </button>
          <button
            className="flex-1 py-3 border-gray-200 transition-colors duration-200 hover:bg-gray-200 border-x"
            onClick={() => handleSnapThreshold(128)}
          >
            None
          </button>
          <button
            className="flex-1 py-3 transition-colors duration-200 hover:bg-gray-200"
            onClick={() => handleSnapThreshold(backgroundThreshold + 10)}
          >
            Lighter
          </button>
        </div>
      </div>
      <Button
        onClick={() => fileInputRef.current?.click()}
        className="mt-2 w-full text-white bg-green-500"
      >
        <Upload className="mr-2 w-4 h-4" /> Upload Image
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      {uploadedImage && (
        <div className="mt-4 space-y-2">
          <Button
            onClick={() => {
              if (tool === "transform") {
                applyTransformedImage();
                setTool("draw");
              } else {
                setTool("transform");
              }
            }}
            className={`w-full ${
              tool === "transform"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {tool === "transform" ? (
              <Check className="mr-2 w-4 h-4" />
            ) : (
              <Move className="mr-2 w-4 h-4" />
            )}
            {tool === "transform" ? "Apply Changes" : "Transform"}
          </Button>
          {tool === "transform" && (
            <>
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Zoom Level: {zoomLevel.toFixed(2)}
                </label>
                <Slider
                  value={[zoomLevel]}
                  onValueChange={(value) => setZoomLevel(value[0])}
                  min={0.1}
                  max={2}
                  step={0.01}
                  className="p-4 w-full bg-gray-200 rounded"
                />
              </div>
              <Button
                onClick={handleRotate}
                className="w-full text-gray-800 bg-gray-200"
              >
                <RotateCw className="mr-2 w-4 h-4" /> Rotate 90°
              </Button>
              <Button
                onClick={setShowPixelated}
                className="w-full text-gray-800 bg-gray-200"
              >
                {showPixelated ? (
                  <>
                    <Eye className="mr-2 w-4 h-4" /> Show Original
                  </>
                ) : (
                  <>
                    <EyeOff className="mr-2 w-4 h-4" /> Show Pixelated
                  </>
                )}
              </Button>
              <Button
                onClick={() => setTool("draw")}
                className="w-full text-white bg-red-500"
              >
                <X className="mr-2 w-4 h-4" /> Cancel
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageImporter;

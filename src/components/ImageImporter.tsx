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

  return (
    <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg shadow-lg">
      <h4 className="mb-2 font-semibold text-md">Paste / Import Image</h4>
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Background Threshold: {backgroundThreshold}
        </label>
        <Slider
          value={[backgroundThreshold]}
          onValueChange={(value) => setBackgroundThreshold(value[0])}
          min={0}
          max={255}
          step={1}
          className="w-full p-4 bg-gray-200 rounded"
        />
      </div>
      <Button
        onClick={() => fileInputRef.current?.click()}
        className="w-full mt-2 text-white bg-green-500"
      >
        <Upload className="w-4 h-4 mr-2" /> Upload Image
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
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Move className="w-4 h-4 mr-2" />
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
                  className="w-full p-4 bg-gray-200 rounded"
                />
              </div>
              <Button
                onClick={handleRotate}
                className="w-full text-gray-800 bg-gray-200"
              >
                <RotateCw className="w-4 h-4 mr-2" /> Rotate 90°
              </Button>
              <Button
                onClick={setShowPixelated}
                className="w-full text-gray-800 bg-gray-200"
              >
                {showPixelated ? (
                  <>
                    <Eye className="w-4 h-4 mr-2" /> Show Original
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" /> Show Pixelated
                  </>
                )}
              </Button>
              <Button
                onClick={() => setTool("draw")}
                className="w-full text-white bg-red-500"
              >
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageImporter;

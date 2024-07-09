import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Blend, Pipette } from "lucide-react";

interface ColorPickerProps {
  currentColor: string;
  setCurrentColor: (color: string) => void;
  setTool: (tool: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  currentColor,
  setCurrentColor,
  setTool,
}) => {
  return (
    <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg shadow-lg">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-gray-700">Color</label>
        <div className="flex items-center space-x-2">
          <Input
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            className="w-10 h-10 p-1 border border-gray-300 rounded"
          />
          <Input
            type="text"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            className="flex-grow"
          />
          <Button
            onClick={() => setCurrentColor("transparent")}
            className="text-gray-800 bg-gray-200 hover:text-white"
          >
            <Blend className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setTool("eyedropper")}
            className="text-gray-800 bg-gray-200 hover:text-white"
          >
            <Pipette className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;

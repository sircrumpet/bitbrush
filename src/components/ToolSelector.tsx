import React from "react";
import { Button } from "@/components/ui/button";
import { Paintbrush, Eraser, Pipette } from "lucide-react";

interface ToolSelectorProps {
  tool: string;
  setTool: (tool: string) => void;
}

const ToolSelector: React.FC<ToolSelectorProps> = ({ tool, setTool }) => {
  return (
    <div className="flex flex-col mt-4 space-y-2">
      {(["draw", "erase", "fill", "eyedropper"] as const).map((value) => (
        <Button
          key={value}
          onClick={() => setTool(value)}
          className={`justify-start ${
            tool === value
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-800 hover:text-white"
          } ${
            value === "eyedropper" && tool === "eyedropper"
              ? "ring-2 ring-blue-500"
              : ""
          }`}
        >
          {value === "draw" && <Paintbrush className="w-4 h-4 mr-2" />}
          {value === "erase" && <Eraser className="w-4 h-4 mr-2" />}
          {value === "fill" && <Paintbrush className="w-4 h-4 mr-2" />}
          {value === "eyedropper" && <Pipette className="w-4 h-4 mr-2" />}
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Button>
      ))}
    </div>
  );
};

export default ToolSelector;

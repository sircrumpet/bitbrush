import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface CanvasClearButtonProps {
  clearCanvas: () => void;
}

const CanvasClearButton: React.FC<CanvasClearButtonProps> = ({
  clearCanvas,
}) => {
  return (
    <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg shadow-lg">
      <Button onClick={clearCanvas} className="w-full text-white bg-red-500">
        <Trash2 className="w-4 h-4 mr-2" /> Clear Canvas
      </Button>
    </div>
  );
};

export default CanvasClearButton;

import React from "react";
import { Button } from "@/components/ui/button";
import { Undo, Redo } from "lucide-react";

interface HistoryControlsProps {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const HistoryControls: React.FC<HistoryControlsProps> = ({
  undo,
  redo,
  canUndo,
  canRedo,
}) => {
  return (
    <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg shadow-lg">
      <div className="flex space-x-2">
        <Button
          onClick={undo}
          disabled={!canUndo}
          className="flex-1 text-gray-800 bg-gray-200 hover:text-white"
        >
          <Undo className="w-4 h-4 mr-2" /> Undo
        </Button>
        <Button
          onClick={redo}
          disabled={!canRedo}
          className="flex-1 text-gray-800 bg-gray-200 hover:text-white"
        >
          <Redo className="w-4 h-4 mr-2" /> Redo
        </Button>
      </div>
    </div>
  );
};

export default HistoryControls;

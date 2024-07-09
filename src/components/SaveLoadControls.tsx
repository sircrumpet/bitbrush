import React from "react";
import { Button } from "@/components/ui/button";
import { Save, FileInput } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SaveLoadControlsProps {
  saveInstructions: () => void;
  loadInstructions: (title: string) => void;
  savedArts: { [key: string]: string };
  isLoadDialogOpen: boolean;
  setIsLoadDialogOpen: (isOpen: boolean) => void;
}

const SaveLoadControls: React.FC<SaveLoadControlsProps> = ({
  saveInstructions,
  loadInstructions,
  savedArts,
  isLoadDialogOpen,
  setIsLoadDialogOpen,
}) => {
  return (
    <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg shadow-lg">
      <div className="flex space-x-2">
        <Button
          onClick={saveInstructions}
          className="flex-1 text-white bg-blue-500"
        >
          <Save className="w-4 h-4 mr-2" /> Save
        </Button>
        <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="flex-1 text-white bg-green-500"
              onClick={() => setIsLoadDialogOpen(true)}
            >
              <FileInput className="w-4 h-4 mr-2" /> Load
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Load Pixel Art</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {Object.entries(savedArts).map(([artTitle, thumbnail]) => (
                <div
                  key={artTitle}
                  className="flex items-center justify-between space-x-2"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={thumbnail}
                      alt={artTitle}
                      className="w-16 h-16 border border-gray-300"
                    />
                    <span>{artTitle}</span>
                  </div>
                  <Button onClick={() => loadInstructions(artTitle)}>
                    Load
                  </Button>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SaveLoadControls;

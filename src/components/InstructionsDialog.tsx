import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Copy, FileUp, FileDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface InstructionsDialogProps {
  pixels: string[];
  title: string;
  description: string;
  setPixels: React.Dispatch<React.SetStateAction<string[]>>;
  addToHistory: (newPixels: string[]) => void;
}

const InstructionsDialog: React.FC<InstructionsDialogProps> = ({
  pixels,
  title,
  description,
  setPixels,
  addToHistory,
}) => {
  const [instructions, setInstructions] = useState<string>("");

  useEffect(() => {
    generateInstructions();
  }, [pixels, title, description]);

  const generateInstructions = () => {
    const uniqueColors = Array.from(new Set(pixels));
    const colorMap: { [key: string]: string } = Object.fromEntries(
      uniqueColors.map((color, index) => [
        color,
        String.fromCharCode(65 + index),
      ])
    );
    const colorDefinitions = uniqueColors.map(
      (color, index) => `${String.fromCharCode(65 + index)}: ${color}`
    );
    const pixelGrid = Array(16)
      .fill(null)
      .map((_, i) =>
        pixels
          .slice(i * 16, (i + 1) * 16)
          .map((color) => colorMap[color])
          .join("")
      );

    const instructionsText = `Title: ${title}

Description: """
${description}
"""

${colorDefinitions.join("\n")}

${pixelGrid.join("\n")}`;

    setInstructions(instructionsText);
  };

  const parseInstructions = (input: string) => {
    const lines = input.trim().split("\n");
    let newTitle = "";
    let newDescription = "";
    const colorMap: { [key: string]: string } = {};
    const newPixelGrid: string[] = [];

    let inDescription = false;
    let inColorDefinitions = false;

    lines.forEach((line) => {
      if (line.startsWith("Title:")) {
        newTitle = line.slice(6).trim();
      } else if (line.startsWith('Description: """')) {
        inDescription = true;
      } else if (inDescription && line === '"""') {
        inDescription = false;
      } else if (inDescription) {
        newDescription += line + "\n";
      } else if (line.includes(":") && !inColorDefinitions) {
        inColorDefinitions = true;
        const [char, color] = line.split(":");
        colorMap[char.trim()] = color.trim();
      } else if (line.length === 16 && !line.includes(":")) {
        newPixelGrid.push(line);
      }
    });

    const newPixels = newPixelGrid.flatMap((row) =>
      row.split("").map((char) => colorMap[char] || "transparent")
    );

    setPixels(newPixels);
    addToHistory(newPixels);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          onClick={generateInstructions}
          className="w-full mb-2 text-white bg-yellow-500"
        >
          <Copy className="w-4 h-4 mr-2" /> View Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pixel Art Instructions</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <textarea
            className="w-full h-40 p-2 border border-gray-300 rounded"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Pixel art instructions..."
          />
          <div className="flex justify-between">
            <Button
              onClick={() => navigator.clipboard.writeText(instructions)}
              className="text-white bg-blue-500"
            >
              <FileUp className="w-4 h-4 mr-2" /> Copy
            </Button>
            <Button
              onClick={() => parseInstructions(instructions)}
              className="text-white bg-green-500"
            >
              <FileDown className="w-4 h-4 mr-2" /> Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstructionsDialog;

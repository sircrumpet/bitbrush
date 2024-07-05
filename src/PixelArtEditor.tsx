import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import {
  Download,
  Upload,
  Eraser,
  Paintbrush,
  Undo,
  Redo,
  Copy,
  FileUp,
  FileDown,
  Pipette,
  Blend,
  Save,
  FileInput,
  Trash2,
  Sparkles,
  Clipboard,
  Sun,
  Moon,
} from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface PixelArtInstructions {
  title: string;
  description: string;
  colorDefinitions: { [key: string]: string };
  pixelGrid: string[];
}

const PixelArtEditor: React.FC = () => {
  const [pixels, setPixels] = useState<string[]>(
    Array(256).fill("transparent")
  );
  const [currentColor, setCurrentColor] = useState<string>("#FFFFFF");
  const [tool, setTool] = useState<string>("draw");
  const [history, setHistory] = useState<string[][]>([
    Array(256).fill("transparent"),
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [instructions, setInstructions] = useState<string>("");
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewSizes = [16, 32, 64, 96, 128];
  const previewRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [title, setTitle] = useState<string>("Untitled Pixel Art");
  const [description, setDescription] = useState<string>(
    "A 16x16 pixel art creation."
  );
  const [savedArts, setSavedArts] = useState<{ [key: string]: string }>({});
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTitleDescriptionLoading, setIsTitleDescriptionLoading] =
    useState<boolean>(false);
  const [backgroundThreshold, setBackgroundThreshold] = useState<number>(220);
  const [isUploadOptionsOpen, setIsUploadOptionsOpen] = useState(false);
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(
    null
  );
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [cropThreshold, setCropThreshold] = useState<number>(0);
  const [maxCropThreshold, setMaxCropThreshold] = useState<number>(100);

  useEffect(() => {
    const saved = localStorage.getItem("savedPixelArts");
    if (saved) {
      setSavedArts(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    renderPixels();
    renderPreviews();
  }, [pixels, isDarkMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [historyIndex, history]);

  const renderPixels = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas background based on theme
    ctx.fillStyle = isDarkMode ? "#333" : "#fff";
    ctx.fillRect(0, 0, 320, 320);

    pixels.forEach((color, i) => {
      const x = (i % 16) * 20,
        y = Math.floor(i / 16) * 20;
      if (color !== "transparent") {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 20, 20);
      }
    });
    // Draw grid
    ctx.strokeStyle = isDarkMode ? "#555" : "#e5e7eb";
    for (let i = 0; i <= 16; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 20, 0);
      ctx.lineTo(i * 20, 320);
      ctx.moveTo(0, i * 20);
      ctx.lineTo(320, i * 20);
      ctx.stroke();
    }
  };

  const renderPreviews = () => {
    previewSizes.forEach((size, index) => {
      const canvas = previewRefs.current[index];
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;

      // Set canvas size to accommodate both white and black backgrounds
      canvas.width = size * 2;
      canvas.height = size;

      // Render on white background
      ctx.fillStyle = "#FFD6D7";
      ctx.fillRect(0, 0, size, size);
      renderPreviewContent(ctx, size);

      // Render on black background
      ctx.fillStyle = "black";
      ctx.fillRect(size, 0, size, size);
      renderPreviewContent(ctx, size, size);
    });
  };

  const renderPreviewContent = (
    ctx: CanvasRenderingContext2D,
    size: number,
    offsetX: number = 0
  ) => {
    pixels.forEach((color, i) => {
      if (color !== "transparent") {
        const x = (i % 16) * (size / 16) + offsetX,
          y = Math.floor(i / 16) * (size / 16);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, size / 16, size / 16);
      }
    });
  };

  const handleCanvasInteraction = (
    e: React.MouseEvent<HTMLCanvasElement>,
    start: boolean = false
  ) => {
    if (start) setIsDrawing(true);
    if (!isDrawing && !start) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 20);
    const y = Math.floor((e.clientY - rect.top) / 20);
    const index = y * 16 + x;

    if (x >= 0 && x < 16 && y >= 0 && y < 16) {
      const newPixels = [...pixels];
      if (tool === "draw") newPixels[index] = currentColor;
      else if (tool === "erase") newPixels[index] = "transparent";
      else if (tool === "fill")
        floodFill(newPixels, index, pixels[index], currentColor);
      else if (tool === "eyedropper") {
        const pickedColor =
          pixels[index] === "transparent"
            ? "transparent"
            : pixels[index].startsWith("#")
            ? pixels[index].slice(0, 7) // Ensure only 6 hex digits after #
            : pixels[index].startsWith("rgba(")
            ? `#${pixels[index]
                .match(/\d+/g)!
                .slice(0, 3)
                .map((x) => parseInt(x).toString(16).padStart(2, "0"))
                .join("")}`
            : `#${pixels[index]
                .replace(/[^0-9A-Fa-f]/g, "")
                .slice(0, 6)
                .padStart(6, "0")}`;
        setCurrentColor(
          pickedColor === "transparent" ? "#ffffff" : pickedColor
        );
        console.log("Picked color:", pickedColor); // Add this line for debugging
        setTool("draw");
      }
      setPixels(newPixels);
      if (!isDrawing) addToHistory(newPixels);
    }
  };

  const floodFill = (
    pixelArray: string[],
    index: number,
    targetColor: string,
    fillColor: string
  ) => {
    if (
      index < 0 ||
      index >= pixelArray.length ||
      pixelArray[index] !== targetColor ||
      pixelArray[index] === fillColor
    )
      return;
    pixelArray[index] = fillColor;
    floodFill(pixelArray, index - 1, targetColor, fillColor);
    floodFill(pixelArray, index + 1, targetColor, fillColor);
    floodFill(pixelArray, index - 16, targetColor, fillColor);
    floodFill(pixelArray, index + 16, targetColor, fillColor);
  };

  const addToHistory = (newPixels: string[]) => {
    setHistory(history.slice(0, historyIndex + 1).concat([newPixels]));
    setHistoryIndex(historyIndex + 1);
  };

  const generateTitleAndDescription = async (imageUrl: string) => {
    setIsTitleDescriptionLoading(true);
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: `${import.meta.env.VITE_OPENAI_MODEL}`,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "You receive a pixel art image which you must name and provide a creative description for.",
                },
                {
                  type: "image_url",
                  image_url: { url: imageUrl },
                },
              ],
            },
          ],
          functions: [
            {
              name: "set_title_and_description",
              description: "Set the title and description for the pixel art",
              parameters: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description:
                      "The title for the pixel art. Keep this very simple, preferring a straightforward noun description. You don't need to mention that it's pixel art.",
                  },
                  description: {
                    type: "string",
                    description:
                      "A one sentence creative description of the image. You don't need to mention that it's pixel art.",
                  },
                },
                required: ["title", "description"],
              },
            },
          ],
          function_call: { name: "set_title_and_description" },
        },
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const functionCall = response.data.choices[0].message.function_call;
      if (functionCall && functionCall.name === "set_title_and_description") {
        const { title, description } = JSON.parse(functionCall.arguments);
        setTitle(title);
        setDescription(description);
        return title;
      }
    } catch (error) {
      console.error("Error generating title and description:", error);
    } finally {
      setIsTitleDescriptionLoading(false);
    }
    return title;
  };

  const processImage = (imageUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setOriginalImageData(imageData);
      const { width, height } = imageData;
      const maxCropAmount = Math.min(width, height) / 2 - 1;
      const newMaxCropThreshold = Math.floor(
        (maxCropAmount / (Math.min(width, height) / 2)) * 100
      );
      setMaxCropThreshold(newMaxCropThreshold);
      const newPixels = processImageData(imageData);
      setPixels(newPixels);
      addToHistory(newPixels);
    };
    img.src = imageUrl;
  };

  const processImageData = (imageData: ImageData): string[] => {
    const { data, width, height } = imageData;

    // Apply crop
    const maxCropAmount = Math.min(width, height) / 2 - 1;
    const cropAmount = Math.min(
      Math.floor(((cropThreshold / 100) * Math.min(width, height)) / 2),
      maxCropAmount
    );
    const croppedWidth = Math.max(width - 2 * cropAmount, 2);
    const croppedHeight = Math.max(height - 2 * cropAmount, 2);
    const startX = Math.floor((width - croppedWidth) / 2);
    const startY = Math.floor((height - croppedHeight) / 2);

    // Create a new canvas for the cropped image
    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = croppedWidth;
    croppedCanvas.height = croppedHeight;
    const croppedCtx = croppedCanvas.getContext("2d");
    if (!croppedCtx) return Array(256).fill("transparent");

    // Draw the cropped portion of the image
    croppedCtx.putImageData(
      imageData,
      -startX,
      -startY,
      startX,
      startY,
      croppedWidth,
      croppedHeight
    );

    // Apply background threshold and make background transparent
    const croppedImageData = croppedCtx.getImageData(
      0,
      0,
      croppedWidth,
      croppedHeight
    );
    for (let i = 0; i < croppedImageData.data.length; i += 4) {
      const r = croppedImageData.data[i];
      const g = croppedImageData.data[i + 1];
      const b = croppedImageData.data[i + 2];
      const brightness = (r + g + b) / 3;
      if (brightness > backgroundThreshold) {
        croppedImageData.data[i + 3] = 0; // Set alpha to 0 for background pixels
      }
    }
    croppedCtx.putImageData(croppedImageData, 0, 0);

    // Resize to 16x16
    const resizeCanvas = document.createElement("canvas");
    resizeCanvas.width = resizeCanvas.height = 16;
    const resizeCtx = resizeCanvas.getContext("2d");
    if (!resizeCtx) return Array(256).fill("transparent");
    resizeCtx.imageSmoothingEnabled = false;
    resizeCtx.drawImage(croppedCanvas, 0, 0, 16, 16);

    const resizedImageData = resizeCtx.getImageData(0, 0, 16, 16);
    const newPixels: string[] = [];
    for (let i = 0; i < resizedImageData.data.length; i += 4) {
      const r = resizedImageData.data[i];
      const g = resizedImageData.data[i + 1];
      const b = resizedImageData.data[i + 2];
      const a = resizedImageData.data[i + 3];
      newPixels.push(
        a === 0 ? "transparent" : `rgba(${r},${g},${b},${a / 255})`
      );
    }

    return newPixels;
  };

  useEffect(() => {
    if (originalImageData) {
      const newPixels = processImageData(originalImageData);
      setPixels(newPixels);
      addToHistory(newPixels);
    }
  }, [backgroundThreshold, cropThreshold]);

  const loadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      if (event.target?.result) {
        processImage(event.target.result as string);
        // Reset title and description
        setTitle("Untitled Pixel Art");
        setDescription("A 16x16 pixel art creation.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadImage(file);
    }
    setIsUploadOptionsOpen(false); // Close the options dialog after upload
  };

  const handleDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      loadImage(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          loadImage(blob);
        }
      }
    }
  };

  const downloadPNG = async () => {
    let currentTitle = title;
    if (currentTitle.toLowerCase() === "untitled pixel art") {
      currentTitle = await generateTitleDescriptionFromCanvas();
    }

    // Create and download the PNG
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 16;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    pixels.forEach((color, i) => {
      if (color !== "transparent") {
        ctx.fillStyle = color;
        ctx.fillRect(i % 16, Math.floor(i / 16), 1, 1);
      }
    });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${currentTitle
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}.png`;
    link.click();
  };

  const generateTitleDescriptionFromCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return title;
    const imageUrl = canvas.toDataURL();
    return await generateTitleAndDescription(imageUrl);
  };

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

    const pixelArtInstructions: PixelArtInstructions = {
      title,
      description,
      colorDefinitions: Object.fromEntries(
        uniqueColors.map((color, index) => [
          String.fromCharCode(65 + index),
          color,
        ])
      ),
      pixelGrid,
    };

    const instructionsText = `Title: ${pixelArtInstructions.title}

Description: """
${pixelArtInstructions.description}
"""

${colorDefinitions.join("\n")}

${pixelGrid.join("\n")}`;

    setInstructions(instructionsText);
  };

  const parseInstructions = (input: string) => {
    const lines = input.trim().split("\n");
    let title = "";
    let description = "";
    const colorMap: { [key: string]: string } = {};
    const pixelGrid: string[] = [];

    let inDescription = false;
    let inColorDefinitions = false;

    lines.forEach((line) => {
      if (line.startsWith("Title:")) {
        title = line.slice(6).trim();
      } else if (line.startsWith('Description: """')) {
        inDescription = true;
      } else if (inDescription && line === '"""') {
        inDescription = false;
      } else if (inDescription) {
        description += line + "\n";
      } else if (line.includes(":") && !inColorDefinitions) {
        inColorDefinitions = true;
        const [char, color] = line.split(":");
        colorMap[char.trim()] = color.trim();
      } else if (line.length === 16 && !line.includes(":")) {
        pixelGrid.push(line);
      }
    });

    const newPixels = pixelGrid.flatMap((row) =>
      row.split("").map((char) => colorMap[char] || "transparent")
    );

    setPixels(newPixels);
    addToHistory(newPixels);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPixels(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPixels(history[historyIndex + 1]);
    }
  };

  const saveInstructions = () => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 16;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    pixels.forEach((color, i) => {
      if (color !== "transparent") {
        ctx.fillStyle = color;
        ctx.fillRect(i % 16, Math.floor(i / 16), 1, 1);
      }
    });
    const thumbnail = canvas.toDataURL();

    const newSavedArts = {
      ...savedArts,
      [title]: thumbnail,
    };
    setSavedArts(newSavedArts);
    localStorage.setItem("savedPixelArts", JSON.stringify(newSavedArts));

    const instructionsData = {
      title,
      description,
      pixels,
    };
    localStorage.setItem(`pixelArt_${title}`, JSON.stringify(instructionsData));
  };

  const loadInstructions = (selectedTitle: string) => {
    const savedInstructions = localStorage.getItem(`pixelArt_${selectedTitle}`);
    if (savedInstructions) {
      const {
        title: savedTitle,
        description: savedDescription,
        pixels: savedPixels,
      } = JSON.parse(savedInstructions);
      setTitle(savedTitle);
      setDescription(savedDescription);
      setPixels(savedPixels);
      addToHistory(savedPixels);
      setIsLoadDialogOpen(false); // Close the dialog after loading
    }
  };

  const clearCanvas = () => {
    const newPixels = Array(256).fill("transparent");
    setPixels(newPixels);
    addToHistory(newPixels);
    setTitle("Untitled Pixel Art");
    setDescription("A 16x16 pixel art creation.");
  };

  const copyImageToClipboard = async (size: number) => {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = tempCanvas.height = size;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    pixels.forEach((color, i) => {
      if (color !== "transparent") {
        ctx.fillStyle = color;
        ctx.fillRect(
          (i % 16) * (size / 16),
          Math.floor(i / 16) * (size / 16),
          size / 16,
          size / 16
        );
      }
    });

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        tempCanvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob"));
          }
        });
      });
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      console.log(`Image copied to clipboard (${size}x${size})`);
      // You might want to add a toast or notification here to inform the user
    } catch (err) {
      console.error("Failed to copy image: ", err);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100" onPaste={handlePaste}>
      <div className="flex flex-1 overflow-hidden">
        <div className="relative flex flex-col p-4 space-y-4 overflow-y-auto bg-white shadow-lg w-80">
          <h1 className="text-2xl font-bold text-gray-800">BitBrush</h1>

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
                  className={`bg-gray-200 text-gray-800 hover:text-white ${
                    tool === "eyedropper" ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                  <Pipette className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col mt-4 space-y-2">
              {(
                [
                  ["draw", "Draw", Paintbrush],
                  ["erase", "Erase", Eraser],
                  ["fill", "Fill", Paintbrush],
                ] as const
              ).map(([value, label, Icon]) => (
                <Button
                  key={value}
                  onClick={() => setTool(value)}
                  className={`justify-start ${
                    tool === value
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" /> {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg shadow-lg">
            <div className="flex space-x-2">
              <Button
                onClick={undo}
                disabled={historyIndex === 0}
                className="flex-1 text-gray-800 bg-gray-200 hover:text-white"
              >
                <Undo className="w-4 h-4 mr-2" /> Undo
              </Button>
              <Button
                onClick={redo}
                disabled={historyIndex === history.length - 1}
                className="flex-1 text-gray-800 bg-gray-200 hover:text-white"
              >
                <Redo className="w-4 h-4 mr-2" /> Redo
              </Button>
            </div>
          </div>

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
              <label className="text-sm font-medium text-gray-700">
                Crop Threshold: {cropThreshold}%
              </label>
              <Slider
                value={[cropThreshold]}
                onValueChange={(value) => setCropThreshold(value[0])}
                min={0}
                max={maxCropThreshold}
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
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg shadow-lg">
            <div className="flex space-x-2">
              <Button
                onClick={saveInstructions}
                className="flex-1 text-white bg-blue-500"
              >
                <Save className="w-4 h-4 mr-2" /> Save
              </Button>
              <Dialog
                open={isLoadDialogOpen}
                onOpenChange={setIsLoadDialogOpen}
              >
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

          <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg shadow-lg">
            <Button
              onClick={clearCanvas}
              className="w-full text-white bg-red-500"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Clear Canvas
            </Button>
          </div>

          <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg shadow-lg">
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
                      onClick={() =>
                        navigator.clipboard.writeText(instructions)
                      }
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
            <Button
              onClick={() => downloadPNG().catch(console.error)}
              className="w-full text-white bg-purple-500"
            >
              <Download className="w-4 h-4 mr-2" /> Download PNG
            </Button>
          </div>

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
        </div>
        <div className="flex flex-col items-center justify-center flex-1 p-8">
          <div className="w-full max-w-md mb-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={cn(
                "w-full mb-2 text-2xl font-bold text-center text-gray-800 bg-transparent border-none outline-none",
                isTitleDescriptionLoading && "animate-pulse"
              )}
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={cn(
                "w-full text-sm text-center text-gray-600 bg-transparent border-none outline-none resize-none",
                isTitleDescriptionLoading && "animate-pulse"
              )}
              rows={2}
            />
          </div>
          <div
            className={`p-4 rounded-lg shadow-lg ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <canvas
              ref={canvasRef}
              width={320}
              height={320}
              onMouseDown={(e) => handleCanvasInteraction(e, true)}
              onMouseMove={handleCanvasInteraction}
              onMouseUp={() => setIsDrawing(false)}
              onMouseLeave={() => setIsDrawing(false)}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border border-gray-300 cursor-crosshair"
            />
          </div>
          <div className="absolute flex items-center p-2 space-x-2 bg-white rounded-full shadow-lg top-4 right-4">
            <Button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${
                isDarkMode
                  ? "text-yellow-400 bg-gray-800 hover:bg-gray-700"
                  : "text-gray-800 bg-yellow-400 hover:bg-yellow-300"
              }`}
              title={
                isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
              }
            >
              {isDarkMode ? (
                <Sun className="w-6 h-6" />
              ) : (
                <Moon className="w-6 h-6" />
              )}
            </Button>
            <Button
              onClick={generateTitleDescriptionFromCanvas}
              className="p-2 text-white bg-blue-500 rounded-full hover:bg-blue-600"
              title="Generate Title and Description"
            >
              <Sparkles className="w-6 h-6" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="p-2 text-white bg-green-500 rounded-full hover:bg-green-600">
                  <Clipboard className="w-6 h-6 mr-1" />
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {[16, 32, 64, 96, 128, 256].map((size) => (
                  <DropdownMenuItem
                    key={size}
                    className="justify-end cursor-pointer"
                    onSelect={() => copyImageToClipboard(size)}
                  >
                    {size}x{size}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="p-4 text-white bg-blue-500 rounded-lg">
            Loading and generating title...
          </div>
        </div>
      )}
    </div>
  );
};

export default PixelArtEditor;

import React, { useState, useEffect, useCallback, useRef } from "react";
import ColorPicker from "./components/ColorPicker";
import ToolSelector from "./components/ToolSelector";
import HistoryControls from "./components/HistoryControls";
import ImageImporter from "./components/ImageImporter";
import SaveLoadControls from "./components/SaveLoadControls";
import CanvasClearButton from "./components/CanvasClearButton";
import InstructionsDialog from "./components/InstructionsDialog";
import PreviewGrid from "./components/PreviewGrid";
import Canvas from "./components/Canvas";
import TitleDescriptionInput from "./components/TitleDescriptionInput";
import { Button } from "@/components/ui/button";
import {
  Sun,
  Moon,
  Sparkles,
  Clipboard,
  ChevronDown,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import usePixelArt from "./hooks/usePixelArt";
import useTitleDescription from "./hooks/useTitleDescription";
import { loadImage } from "./utils/imageUtils";
import AIImageGenerator from "./components/AIImageGenerator";
import AIGenerationPanel from "./components/AIGenerationPanel";

const PixelArtEditor: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [openAIApiKey, setOpenAIApiKey] = useState("");
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [savedArts, setSavedArts] = useState<{ [key: string]: string }>({});
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(
    null
  );
  const [imageTransform, setImageTransform] = useState({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  });

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showPixelated, setShowPixelated] = useState<boolean>(false);
  const [backgroundThreshold, setBackgroundThreshold] = useState<number>(128);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { toast } = useToast();

  const {
    pixels,
    setPixels,
    currentColor,
    setCurrentColor,
    tool,
    setTool,
    history,
    historyIndex,
    addToHistory,
    undo,
    redo,
    clearCanvas,
    isDrawing,
    setIsDrawing,
  } = usePixelArt();

  const {
    title,
    setTitle,
    description,
    setDescription,
    isTitleDescriptionLoading,
    generateTitleAndDescription,
  } = useTitleDescription(openAIApiKey);

  const [isAIGeneratorVisible, setIsAIGeneratorVisible] = useState(false);

  useEffect(() => {
    const savedOpenAIApiKey = localStorage.getItem("openai_api_key");
    if (savedOpenAIApiKey) {
      setOpenAIApiKey(savedOpenAIApiKey);
    }
    const saved = localStorage.getItem("savedPixelArts");
    if (saved) {
      setSavedArts(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((event.ctrlKey || event.metaKey) && event.key === "y") {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [undo, redo]);

  const processUploadedImage = (img: HTMLImageElement) => {
    setUploadedImage(img);
    // Set the zoom level based on the image size
    const imageZoomLevel = 320 / Math.max(img.width, img.height);
    console.log("Calculating zoom level for image:", {
      desired: 320,
      width: img.width,
      height: img.height,
      imageZoomLevel,
    });
    const newPixels = processImage(img, {
      rotation: imageTransform.rotation,
      scale: imageZoomLevel,
      backgroundThreshold,
      x: imageTransform.x,
      y: imageTransform.y,
    });
    setPixels(newPixels);
    setZoomLevel(imageZoomLevel);
    addToHistory(newPixels);
    setTool("transform");
    setImageTransform({ x: 0, y: 0, scale: 1, rotation: 0 });
  };
  const handleImageUpload = async (file: File) => {
    try {
      const imageUrl = await loadImage(file);
      const img = new Image();
      img.onload = () => processUploadedImage(img);
      img.src = imageUrl;
    } catch (error) {
      console.error("Error loading image:", error);
      toast({
        title: "Error",
        description: "Failed to load image",
        variant: "destructive",
      });
    }
  };
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          handleImageUpload(blob);
        }
      }
    }
  };

  const processImage = useCallback(
    (
      imgOrCanvas: HTMLImageElement | HTMLCanvasElement,
      options: {
        rotation: number;
        scale: number;
        backgroundThreshold: number;
        x: number;
        y: number;
      }
    ) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return Array(256).fill("transparent");

      canvas.width = canvas.height = 320;

      const centerX = 160 + options.x;
      const centerY = 160 + options.y;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((options.rotation * Math.PI) / 180);

      if (imgOrCanvas instanceof HTMLImageElement) {
        const scaledWidth = imgOrCanvas.width * options.scale;
        const scaledHeight = imgOrCanvas.height * options.scale;
        ctx.drawImage(
          imgOrCanvas,
          -scaledWidth / 2,
          -scaledHeight / 2,
          scaledWidth,
          scaledHeight
        );
      } else {
        ctx.drawImage(imgOrCanvas, -160, -160);
      }

      ctx.restore();

      const imageData = ctx.getImageData(0, 0, 320, 320);
      const newPixels: string[] = [];

      const midpoint = 128;

      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const i = ((y * 20 + 10) * 320 + (x * 20 + 10)) * 4;
          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];
          const a = imageData.data[i + 3];
          const brightness = (r + g + b) / 3;

          let isTransparent;
          if (options.backgroundThreshold === midpoint) {
            isTransparent = false; // No thresholding at midpoint
          } else if (options.backgroundThreshold > midpoint) {
            // White thresholding
            isTransparent = brightness >= options.backgroundThreshold;
          } else {
            // Black thresholding
            const darknessThreshold = 127 - options.backgroundThreshold;
            isTransparent = brightness <= darknessThreshold;
          }

          newPixels.push(
            isTransparent || a === 0
              ? "transparent"
              : `rgba(${r},${g},${b},${a / 255})`
          );
        }
      }
      return newPixels;
    },
    []
  );

  const handleZoomChange = (value: number) => {
    setZoomLevel(value);
    if (uploadedImage) {
      const newPixels = processImage(uploadedImage, {
        rotation: imageTransform.rotation,
        scale: value,
        backgroundThreshold,
        x: imageTransform.x,
        y: imageTransform.y,
      });
      setPixels(newPixels);
    }
  };

  const handleBackgroundThresholdChange = (value: number) => {
    setBackgroundThreshold(value);
    if (uploadedImage) {
      const newPixels = processImage(uploadedImage, {
        rotation: imageTransform.rotation,
        scale: zoomLevel,
        backgroundThreshold: value,
        x: imageTransform.x,
        y: imageTransform.y,
      });
      setPixels(newPixels);
    }
  };

  const handleRotate = () => {
    setImageTransform((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
    if (uploadedImage) {
      const newPixels = processImage(uploadedImage, {
        rotation: (imageTransform.rotation + 90) % 360,
        scale: zoomLevel,
        backgroundThreshold,
        x: imageTransform.x,
        y: imageTransform.y,
      });
      setPixels(newPixels);
    }
  };

  const handleApplyTransform = () => {
    if (uploadedImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const CANVAS_SIZE = 320;
      const PIXEL_RESOLUTION = 16;

      // Create a temporary canvas to hold the visible portion of the image
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = CANVAS_SIZE;
      tempCanvas.height = CANVAS_SIZE;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;

      // Copy the visible portion of the image to the temporary canvas
      tempCtx.drawImage(canvas, 0, 0);

      // Create the pixelated version
      const newPixels: string[] = [];
      const pixelSize = CANVAS_SIZE / PIXEL_RESOLUTION;
      for (let y = 0; y < PIXEL_RESOLUTION; y++) {
        for (let x = 0; x < PIXEL_RESOLUTION; x++) {
          const sourceX = x * pixelSize + pixelSize / 2;
          const sourceY = y * pixelSize + pixelSize / 2;
          const colorData = tempCtx.getImageData(sourceX, sourceY, 1, 1).data;
          newPixels.push(
            `rgba(${colorData[0]}, ${colorData[1]}, ${colorData[2]}, ${
              colorData[3] / 255
            })`
          );
        }
      }

      setPixels(newPixels);
      addToHistory(newPixels);
      setShowPixelated(true);
    }
  };

  const togglePixelated = () => {
    setShowPixelated((prev) => !prev);
    if (!showPixelated) {
      // If switching to pixelated view, update the pixels without changing zoom
      handleApplyTransform();
    }
  };

  const updatePreview = useCallback(() => {
    if (canvasRef.current && uploadedImage) {
      const newPixels = processImage(uploadedImage, {
        rotation: imageTransform.rotation,
        scale: zoomLevel,
        backgroundThreshold,
        x: imageTransform.x,
        y: imageTransform.y,
      });
      setPixels(newPixels);
    }
  }, [
    uploadedImage,
    imageTransform,
    zoomLevel,
    backgroundThreshold,
    processImage,
  ]);
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const saveApiKeys = () => {
    localStorage.setItem("openai_api_key", openAIApiKey);
    setIsSettingsOpen(false);
    toast({
      title: "API Key Saved",
      description: "Your OpenAI API key has been saved successfully.",
    });
  };

  const generateTitleDescriptionFromCanvas = async () => {
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
    const imageUrl = canvas.toDataURL();
    const newTitle = await generateTitleAndDescription(imageUrl);
    return newTitle || "Untitled Pixel Art";
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
      setIsLoadDialogOpen(false);
    }
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
      toast({
        title: "Success",
        description: `Image copied to clipboard (${size}x${size})`,
      });
    } catch (err) {
      console.error("Failed to copy image: ", err);
      toast({
        title: "Error",
        description: "Failed to copy image to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadPNG = async () => {
    let currentTitle = title;
    if (currentTitle.toLowerCase() === "untitled pixel art") {
      currentTitle = await generateTitleDescriptionFromCanvas();
    }

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

  const handleAIGeneratedImage = (imageUrl: string) => {
    fetch(imageUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const img = new Image();
        img.onload = () => {
          const scale = 320 / Math.max(img.width, img.height);
          console.log("Calculating scale for image:", {
            desired: 320,
            width: img.width,
            height: img.height,
            scale,
          });
          setUploadedImage(img);
          setImageTransform({ x: 0, y: 0, scale, rotation: 0 });
          setZoomLevel(scale);
          setTool("transform");
          setShowPixelated(false);
          updatePreview();
        };
        img.src = URL.createObjectURL(blob);
      })
      .catch((error) => {
        console.error("Error loading AI generated image:", error);
        toast({
          title: "Error",
          description: "Failed to load the generated image. Please try again.",
          variant: "destructive",
        });
      });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100" onPaste={handlePaste}>
      <div className="flex overflow-hidden flex-1">
        <div className="flex overflow-y-auto relative flex-col p-4 space-y-4 w-80 bg-white shadow-lg">
          <h1 className="text-2xl font-bold text-gray-800">BitBrush</h1>
          <ColorPicker
            currentColor={currentColor}
            setCurrentColor={setCurrentColor}
            setTool={setTool}
          />
          <ToolSelector tool={tool} setTool={setTool} />
          <HistoryControls
            undo={undo}
            redo={redo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
          />
          <ImageImporter
            backgroundThreshold={backgroundThreshold}
            setBackgroundThreshold={handleBackgroundThresholdChange}
            handleImageUpload={handleImageUpload}
            tool={tool}
            setTool={setTool}
            zoomLevel={zoomLevel}
            setZoomLevel={handleZoomChange}
            handleRotate={handleRotate}
            applyTransformedImage={handleApplyTransform}
            uploadedImage={uploadedImage}
            showPixelated={showPixelated}
            setShowPixelated={togglePixelated}
          />
          <SaveLoadControls
            savedArts={savedArts}
            isLoadDialogOpen={isLoadDialogOpen}
            setIsLoadDialogOpen={setIsLoadDialogOpen}
            saveInstructions={saveInstructions}
            loadInstructions={loadInstructions}
          />
          <CanvasClearButton clearCanvas={clearCanvas} />
          <InstructionsDialog
            pixels={pixels}
            title={title}
            description={description}
            setPixels={setPixels}
            addToHistory={addToHistory}
          />
          <Button
            onClick={downloadPNG}
            className="w-full text-white bg-purple-500"
          >
            Download PNG
          </Button>
          <PreviewGrid pixels={pixels} imageTransform={imageTransform} />
        </div>
        <div className="flex flex-col flex-1 justify-center items-center p-8">
          <TitleDescriptionInput
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            isTitleDescriptionLoading={isTitleDescriptionLoading}
          />
          <div
            className={`p-4 rounded-lg shadow-lg ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <Canvas
              ref={canvasRef}
              pixels={pixels}
              setPixels={setPixels}
              tool={tool}
              currentColor={currentColor}
              isDarkMode={isDarkMode}
              uploadedImage={uploadedImage}
              imageTransform={imageTransform}
              setImageTransform={setImageTransform}
              addToHistory={addToHistory}
              setCurrentColor={setCurrentColor}
              setTool={setTool}
              handleImageUpload={handleImageUpload}
              showPixelated={showPixelated}
              zoomLevel={zoomLevel}
              handleZoomChange={handleZoomChange}
              backgroundThreshold={backgroundThreshold}
              processImage={processImage}
              updatePreview={updatePreview}
            />
          </div>
          <div className="flex absolute top-4 right-4 items-center p-2 space-x-2 bg-white rounded-full shadow-lg">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="p-2 text-white bg-blue-500 rounded-full hover:bg-blue-600"
                  title="AI Features"
                >
                  <Sparkles className="w-6 h-6" />
                  <ChevronDown className="ml-1 w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={generateTitleDescriptionFromCanvas}>
                  Generate Title and Description
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setIsAIGeneratorVisible(true)}
                >
                  Generate Pixel Art
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="p-2 text-white bg-green-500 rounded-full hover:bg-green-600">
                  <Clipboard className="mr-1 w-6 h-6" />
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
            <Button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-white bg-gray-500 rounded-full hover:bg-gray-600"
              title="Settings"
            >
              <Settings className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="openai-api-key"
                className="text-sm font-medium text-gray-700"
              >
                OpenAI API Key
              </label>
              <p className="text-sm text-gray-600">
                We use the OpenAI API to generate creative titles and
                descriptions for your pixel art.
              </p>
              <Input
                id="openai-api-key"
                type="password"
                value={openAIApiKey}
                onChange={(e) => setOpenAIApiKey(e.target.value)}
                placeholder="Enter your OpenAI API key"
              />
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline"
              >
                Visit OpenAI to register and/or setup a new API key
              </a>
            </div>
            <Button
              onClick={saveApiKeys}
              className="w-full text-white bg-blue-500"
            >
              Save API Key
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AIGenerationPanel
        isVisible={isAIGeneratorVisible}
        onClose={() => setIsAIGeneratorVisible(false)}
        title={title}
        description={description}
        onImageSelect={handleAIGeneratedImage}
      />
    </div>
  );
};

export default PixelArtEditor;

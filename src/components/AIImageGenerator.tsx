import React, { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as Dialog from "@radix-ui/react-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import axios from "axios";

interface AIImageGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onImageSelect: (imageData: string) => void;
}

const AIImageGenerator: React.FC<AIImageGeneratorProps> = ({
  isOpen,
  onClose,
  title,
  description,
  onImageSelect,
}) => {
  const [images, setImages] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [loadingStates, setLoadingStates] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateImage = async (index: number) => {
    setLoadingStates((prev) =>
      prev.map((state, i) => (i === index ? true : state))
    );
    setError(null);

    try {
      const response = await axios.post(
        "http://localhost:3001/api/generate-images",
        { title, description, index }
      );
      const { predictionId } = response.data;

      const pollPrediction = async () => {
        const statusResponse = await axios.get(
          `http://localhost:3001/api/predictions/${predictionId}`
        );
        const result = statusResponse.data;

        if (result.status === "succeeded") {
          const proxiedImage = `http://localhost:3001/api/proxy-image?url=${encodeURIComponent(
            result.output[0]
          )}`;
          setImages((prev) =>
            prev.map((img, i) => (i === index ? proxiedImage : img))
          );
          setLoadingStates((prev) =>
            prev.map((state, i) => (i === index ? false : state))
          );
        } else if (result.status === "failed") {
          throw new Error(result.error || "Image generation failed");
        } else {
          setTimeout(pollPrediction, 1000);
        }
      };

      pollPrediction();
    } catch (error) {
      console.error(`Error generating image ${index}:`, error);
      setError(`Failed to generate image ${index + 1}. Please try again.`);
      setLoadingStates((prev) =>
        prev.map((state, i) => (i === index ? false : state))
      );
    }
  };

  const generateAllImages = () => {
    for (let i = 0; i < 4; i++) {
      generateImage(i);
    }
  };

  useEffect(() => {
    if (isOpen) {
      generateAllImages();
    }
  }, [isOpen]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-md p-6 shadow-lg sm:max-w-[600px] w-full">
          <Dialog.Title className="mb-2 text-lg font-semibold">
            AI Generated Pixel Art for "{title}"
          </Dialog.Title>
          <Dialog.Description className="mb-4 text-sm text-gray-500">
            Click on an image to select it, or use the "Generate" button to
            create new ones.
          </Dialog.Description>
          <div className="grid grid-cols-2 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative">
                {loadingStates[index] ? (
                  <div className="w-full h-40 flex items-center justify-center bg-gray-100 rounded">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : image ? (
                  <img
                    src={image}
                    alt={`AI Generated Pixel Art ${index + 1}`}
                    className="w-full h-40 object-contain transition-opacity cursor-pointer hover:opacity-80"
                    onClick={() => onImageSelect(image)}
                  />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center bg-gray-100 rounded">
                    <Button size="sm" onClick={() => generateImage(index)}>
                      Generate
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            onClick={generateAllImages}
            disabled={loadingStates.some((state) => state)}
            className="mt-4 w-full"
          >
            Generate All Images
          </Button>
          <Dialog.Close asChild>
            <button
              className="inline-flex absolute top-2 right-2 justify-center items-center w-6 h-6 text-gray-500 rounded-full appearance-none hover:bg-gray-100 focus:outline-none"
              aria-label="Close"
            >
              ✕
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default AIImageGenerator;

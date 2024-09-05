import React, { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";

interface AIGenerationPanelProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onImageSelect: (imageData: string) => void;
}

const AIGenerationPanel: React.FC<AIGenerationPanelProps> = ({
  isVisible,
  onClose,
  title,
  description,
  onImageSelect,
}) => {
  const [images, setImages] = useState<(string | null)[]>([]);
  const [loadingStates, setLoadingStates] = useState<boolean[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async (index: number) => {
    setLoadingStates((prev) => {
      const newStates = [...prev];
      newStates[index] = true;
      return newStates;
    });
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
          setImages((prev) => {
            const newImages = [...prev];
            newImages[index] = proxiedImage;
            return newImages;
          });
          setLoadingStates((prev) => {
            const newStates = [...prev];
            newStates[index] = false;
            return newStates;
          });
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
      setLoadingStates((prev) => {
        const newStates = [...prev];
        newStates[index] = false;
        return newStates;
      });
    }
  };

  const generateMoreImages = () => {
    const newIndex = images.length;
    setImages((prev) => [...prev, null, null, null, null]);
    setLoadingStates((prev) => [...prev, false, false, false, false]);
    for (let i = 0; i < 4; i++) {
      generateImage(newIndex + i);
    }
  };

  useEffect(() => {
    if (isVisible && images.length === 0) {
      generateMoreImages();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed right-4 top-20 w-96 bg-white rounded-lg shadow-lg p-4 max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">AI Generated Icons</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {images.map((image, index) => (
          <div key={index} className="relative">
            {loadingStates[index] ? (
              <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : image ? (
              <img
                src={image}
                alt={`Generated icon ${index + 1}`}
                className="w-20 h-20 object-contain cursor-pointer hover:opacity-80"
                onClick={() => onImageSelect(image)}
              />
            ) : (
              <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded">
                <Button size="sm" onClick={() => generateImage(index)}>
                  Generate
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <Button onClick={generateMoreImages} className="w-full mt-4">
        Generate More
      </Button>
    </div>
  );
};

export default AIGenerationPanel;

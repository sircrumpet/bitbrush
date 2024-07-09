import React from "react";
import { cn } from "@/lib/utils";

interface TitleDescriptionInputProps {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  isTitleDescriptionLoading: boolean;
}

const TitleDescriptionInput: React.FC<TitleDescriptionInputProps> = ({
  title,
  setTitle,
  description,
  setDescription,
  isTitleDescriptionLoading,
}) => {
  return (
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
  );
};

export default TitleDescriptionInput;

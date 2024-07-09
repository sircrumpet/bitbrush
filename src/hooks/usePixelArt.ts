// src/hooks/usePixelArt.ts
import { useState, useCallback } from "react";

const usePixelArt = () => {
  const [pixels, setPixels] = useState<string[]>(
    Array(256).fill("transparent")
  );
  const [currentColor, setCurrentColor] = useState<string>("#FFFFFF");
  const [tool, setTool] = useState<string>("draw");
  const [history, setHistory] = useState<string[][]>([
    Array(256).fill("transparent"),
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  const addToHistory = useCallback(
    (newPixels: string[]) => {
      setHistory((prevHistory) => {
        const newHistory = prevHistory
          .slice(0, historyIndex + 1)
          .concat([newPixels]);
        setHistoryIndex(newHistory.length - 1);
        return newHistory;
      });
    },
    [historyIndex]
  );
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prevIndex) => prevIndex - 1);
      setPixels(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prevIndex) => prevIndex + 1);
      setPixels(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  const clearCanvas = useCallback(() => {
    const newPixels = Array(256).fill("transparent");
    setPixels(newPixels);
    addToHistory(newPixels);
  }, [addToHistory]);

  return {
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
  };
};

export default usePixelArt;

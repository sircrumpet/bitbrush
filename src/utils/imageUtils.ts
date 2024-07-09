export const loadImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error("Failed to load image"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const imageDataToPixels = (imageData: ImageData): string[] => {
  const pixels: string[] = [];
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3];
    pixels.push(a === 0 ? "transparent" : `rgba(${r},${g},${b},${a / 255})`);
  }
  return pixels;
};

export const pixelsToImageData = (
  pixels: string[],
  width: number,
  height: number
): ImageData => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D context");

  const imageData = ctx.createImageData(width, height);
  pixels.forEach((color, i) => {
    if (color !== "transparent") {
      const [r, g, b, a] = color.match(/\d+/g)!.map(Number);
      imageData.data[i * 4] = r;
      imageData.data[i * 4 + 1] = g;
      imageData.data[i * 4 + 2] = b;
      imageData.data[i * 4 + 3] = Math.round(a * 255);
    }
  });

  return imageData;
};

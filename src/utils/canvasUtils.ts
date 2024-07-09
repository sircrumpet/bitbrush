export const floodFill = (
  pixels: string[],
  index: number,
  targetColor: string,
  fillColor: string
): string[] => {
  // If the target color is the same as the fill color, we don't need to do anything
  if (targetColor === fillColor) {
    return pixels;
  }

  const newPixels = [...pixels];
  const stack: number[] = [index];

  while (stack.length > 0) {
    const currentIndex = stack.pop()!;

    if (
      currentIndex < 0 ||
      currentIndex >= newPixels.length ||
      newPixels[currentIndex] !== targetColor
    ) {
      continue;
    }

    newPixels[currentIndex] = fillColor;

    // Check adjacent pixels (up, down, left, right)
    const x = currentIndex % 16;
    const y = Math.floor(currentIndex / 16);

    if (x > 0) stack.push(currentIndex - 1); // Left
    if (x < 15) stack.push(currentIndex + 1); // Right
    if (y > 0) stack.push(currentIndex - 16); // Up
    if (y < 15) stack.push(currentIndex + 16); // Down
  }

  return newPixels;
};

export const drawGrid = (
  ctx: CanvasRenderingContext2D,
  cellSize: number,
  width: number,
  height: number,
  color: string
) => {
  ctx.strokeStyle = color;
  ctx.beginPath();
  for (let i = 0; i <= width; i += cellSize) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i, height);
  }
  for (let j = 0; j <= height; j += cellSize) {
    ctx.moveTo(0, j);
    ctx.lineTo(width, j);
  }
  ctx.stroke();
};

export const getPixelIndex = (
  x: number,
  y: number,
  canvasWidth: number,
  cellSize: number
): number => {
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);
  return row * (canvasWidth / cellSize) + col;
};

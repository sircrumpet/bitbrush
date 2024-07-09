export const renderPixelatedContent = (
  ctx: CanvasRenderingContext2D,
  pixels: string[],
  size: number,
  offsetX: number = 0,
  offsetY: number = 0
) => {
  const pixelSize = size / 16;
  pixels.forEach((color, i) => {
    if (color !== "transparent") {
      const x = (i % 16) * pixelSize + offsetX;
      const y = Math.floor(i / 16) * pixelSize + offsetY;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, pixelSize, pixelSize);
    }
  });
};

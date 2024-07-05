# BitBrush

BitBrush is a Pocket Pixel Art Studio empowering generation and editing workflows.

It's a web-based application that allows users to create, edit, and share pixel art easily.

## Use It

BitBrush is available for use in your browser at [bitbrush.sircrumpet.com](https://bitbrush.sircrumpet.com)

## Origin

BitBrush was initially built to easily generate 16x16 pixel icons for the Yoto Player screens. The Yoto Player, an audio device for children, features a small black pixel display that supports custom icons displayed on a per track / chapter basis. BitBrush streamlines the process of creating these icons, allowing for quick and efficient design of visually appealing 16x16 pixel art that perfectly fits the Yoto Player's display capabilities.

## Features

- Create 16x16 pixel art from scratch
- Import images and convert them to pixel art
- Various drawing tools: draw, erase, fill, eyedropper
- Undo/Redo functionality
- Adjustable background and crop thresholds for image imports
- Save and load pixel art creations
- Export pixel art as PNG
- Copy pixel art to clipboard in various sizes
- Generate titles and descriptions for your pixel art using AI
- Dark mode support

## Technologies Used

- React
- TypeScript
- Vite
- Tailwind CSS
- Radix UI
- Axios
- OpenAI API (for title and description generation)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory and add your OpenAI API key:
   ```
   VITE_OPENAI_MODEL=gpt-4o
   ```
4. Start the development server:
   ```
   npm run dev
   ```

## Usage

1. Use the color picker to select a color
2. Choose a drawing tool (draw, erase, fill, or eyedropper)
3. Click and drag on the canvas to create your pixel art, or add an image via Cmd+V, Drag and Drop, or File Upload
4. Use the undo/redo buttons to correct mistakes
5. Save your creation or export it as a PNG
6. Generate a title and description for your pixel art using the AI feature

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [GNU General Public License v3.0](LICENSE).

import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Add this console log to check if the API key is being loaded
console.log("Replicate API Token:", process.env.VITE_REPLICATE_API_TOKEN);

app.post("/api/generate-images", async (req, res) => {
  const { title, description, index } = req.body;
  const apiKey = process.env.VITE_REPLICATE_API_TOKEN;

  if (!apiKey) {
    console.log("API key is missing in the request handler");
    return res.status(400).json({ error: "Replicate API key is missing" });
  }

  try {
    console.log(
      `Generating image for title: "${title}", description: "${description}", index: ${index}`
    );
    const response = await axios.post(
      "https://api.replicate.com/v1/predictions",
      {
        version:
          "83bd408fc5d2988389c1c1bcdde75545dc0f4ad42aae83082991edcf75a815b2",
        input: {
          prompt: `A 16x16 pixel iconic representation of ${title}${
            description ? `. ${description}` : ""
          }. Image with black transparent background in the style of BITBRUSH.`,
          model: "dev",
          num_outputs: 1,
          guidance_scale: 3.5,
          num_inference_steps: 28,
          disable_safety_checker: true,
        },
      },
      {
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const prediction = response.data;
    console.log("Prediction created:", prediction);

    res.json({ predictionId: prediction.id });
  } catch (error) {
    console.error(
      "Error starting prediction:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      error: "Failed to start image generation",
      details: error.message,
    });
  }
});

// Add this new route to proxy image requests
app.get("/api/proxy-image", async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).send("Image URL is required");
  }

  try {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const contentType = response.headers["content-type"];
    res.setHeader("Content-Type", contentType);
    res.send(response.data);
  } catch (error) {
    console.error("Error proxying image:", error);
    res.status(500).send("Failed to proxy image");
  }
});

app.get("/api/check-env", (req, res) => {
  res.json({
    replicateKeyExists: !!process.env.REPLICATE_API_TOKEN,
    replicateKeyFirstFiveChars: process.env.REPLICATE_API_TOKEN
      ? process.env.REPLICATE_API_TOKEN.slice(0, 5)
      : null,
  });
});

app.get("/api/predictions/:id", async (req, res) => {
  const { id } = req.params;
  const apiKey = process.env.VITE_REPLICATE_API_TOKEN;

  try {
    const response = await axios.get(
      `https://api.replicate.com/v1/predictions/${id}`,
      {
        headers: { Authorization: `Token ${apiKey}` },
      }
    );

    const prediction = response.data;
    console.log("Prediction status:", prediction.status);

    if (prediction.status === "succeeded") {
      res.json({ status: "succeeded", output: prediction.output });
    } else if (prediction.status === "failed") {
      // Handle the failed status
      console.error("Prediction failed:", prediction.error);
      res.status(400).json({
        status: "failed",
        error: prediction.error || "Image generation failed",
      });
    } else {
      res.json({ status: prediction.status });
    }
  } catch (error) {
    console.error(
      "Error checking prediction:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      error: "Failed to check prediction status",
      details: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

import { useState, useCallback } from "react";
import axios from "axios";

const useTitleDescription = (apiKey: string) => {
  const [title, setTitle] = useState<string>("Untitled Pixel Art");
  const [description, setDescription] = useState<string>(
    "A 16x16 pixel art creation."
  );
  const [isTitleDescriptionLoading, setIsTitleDescriptionLoading] =
    useState<boolean>(false);

  const generateTitleAndDescription = useCallback(
    async (imageUrl: string) => {
      if (!apiKey) {
        console.error("API Key is missing");
        return title;
      }

      setIsTitleDescriptionLoading(true);
      try {
        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: `${import.meta.env.VITE_OPENAI_MODEL}`,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "You receive a pixel art image which you must name and provide a creative description for.",
                  },
                  {
                    type: "image_url",
                    image_url: { url: imageUrl },
                  },
                ],
              },
            ],
            functions: [
              {
                name: "set_title_and_description",
                description: "Set the title and description for the pixel art",
                parameters: {
                  type: "object",
                  properties: {
                    title: {
                      type: "string",
                      description:
                        "The title for the pixel art. Keep this very simple, preferring a straightforward noun description. You don't need to mention that it's pixel art.",
                    },
                    description: {
                      type: "string",
                      description:
                        "A one sentence creative description of the image. You don't need to mention that it's pixel art.",
                    },
                  },
                  required: ["title", "description"],
                },
              },
            ],
            function_call: { name: "set_title_and_description" },
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          }
        );

        const functionCall = response.data.choices[0].message.function_call;
        if (functionCall && functionCall.name === "set_title_and_description") {
          const { title: newTitle, description: newDescription } = JSON.parse(
            functionCall.arguments
          );
          setTitle(newTitle);
          setDescription(newDescription);
          return newTitle;
        }
      } catch (error) {
        console.error("Error generating title and description:", error);
      } finally {
        setIsTitleDescriptionLoading(false);
      }
      return title;
    },
    [apiKey, title]
  );

  return {
    title,
    setTitle,
    description,
    setDescription,
    isTitleDescriptionLoading,
    generateTitleAndDescription,
  };
};

export default useTitleDescription;

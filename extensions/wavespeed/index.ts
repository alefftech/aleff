/**
 * Wavespeed AI Extension for Aleff
 *
 * Provides unified access to 700+ AI models for image/video generation
 * Models: FLUX, Kling, Veo, Luma, Stable Diffusion, Leonardo, Ideogram, etc.
 *
 * @see https://docs.wavespeed.ai/api-reference
 */

import type { MoltbotPlugin } from "../../src/plugins/types.js";

type WavespeedConfig = {
  apiKey: string;
  baseUrl?: string;
};

type GenerateImageParams = {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
  guidance_scale?: number;
  num_outputs?: number;
  seed?: number;
  scheduler?: string;
};

type GenerateVideoParams = {
  prompt: string;
  model?: string;
  image_url?: string;
  duration?: number;
  aspect_ratio?: string;
  seed?: number;
};

type WavespeedResponse = {
  id: string;
  status: "processing" | "succeeded" | "failed";
  output?: string[] | string;
  error?: string;
  logs?: string;
};

const DEFAULT_BASE_URL = "https://api.wavespeed.ai/v1";

// Popular models by category
const MODELS = {
  image: {
    flux_pro: "black-forest-labs/flux-1.1-pro",
    flux_dev: "black-forest-labs/flux-dev",
    sdxl: "stability-ai/sdxl",
    sd3: "stability-ai/sd3",
    ideogram_v2: "ideogram-ai/ideogram-v2",
    leonardo: "leonardo-ai/leonardo-vision-xl",
  },
  video: {
    kling: "kling-ai/kling-v1",
    luma_dream: "luma-ai/dream-machine",
    runway_gen3: "runway-ml/gen-3-alpha",
    pika: "pika-labs/pika-1.0",
  },
} as const;

export default function wavespeedPlugin(config: WavespeedConfig): MoltbotPlugin {
  const baseUrl = config.baseUrl?.replace(/\/+$/, "") || DEFAULT_BASE_URL;
  const apiKey = config.apiKey?.trim();

  if (!apiKey) {
    throw new Error("Wavespeed API key is required");
  }

  return {
    name: "wavespeed",

    register(api) {
      console.log("[wavespeed] Registering Wavespeed AI integration...");

      /**
       * Tool: Generate Image
       *
       * Generate images using AI models (FLUX, SDXL, Ideogram, etc.)
       */
      api.registerTool({
        name: "wavespeed_generate_image",
        description: `Generate AI images using Wavespeed API.

Available models:
- ${MODELS.image.flux_pro} (best quality, slower)
- ${MODELS.image.flux_dev} (balanced)
- ${MODELS.image.sdxl} (fast, versatile)
- ${MODELS.image.ideogram_v2} (great for text in images)
- ${MODELS.image.leonardo} (artistic style)

Parameters:
- prompt (required): Text description of the image
- model (optional): Model to use (default: ${MODELS.image.flux_dev})
- width/height (optional): Image dimensions (default: 1024x1024)
- num_outputs (optional): Number of images to generate (1-4, default: 1)
- seed (optional): Random seed for reproducibility

Returns: Array of image URLs`,

        parameters: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "Text description of the image to generate",
            },
            model: {
              type: "string",
              description: `Model to use (default: ${MODELS.image.flux_dev})`,
              enum: Object.values(MODELS.image),
            },
            width: {
              type: "number",
              description: "Image width in pixels (default: 1024)",
            },
            height: {
              type: "number",
              description: "Image height in pixels (default: 1024)",
            },
            num_outputs: {
              type: "number",
              description: "Number of images to generate (1-4, default: 1)",
            },
            seed: {
              type: "number",
              description: "Random seed for reproducibility",
            },
          },
          required: ["prompt"],
        },

        handler: async (args: GenerateImageParams) => {
          try {
            const model = args.model || MODELS.image.flux_dev;
            const payload = {
              input: {
                prompt: args.prompt,
                width: args.width || 1024,
                height: args.height || 1024,
                num_outputs: args.num_outputs || 1,
                seed: args.seed,
              },
            };

            console.log(`[wavespeed] Generating image with ${model}...`);

            const response = await fetch(`${baseUrl}/predictions`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                version: model,
                ...payload,
              }),
            });

            if (!response.ok) {
              const error = await response.text();
              throw new Error(`Wavespeed API error (${response.status}): ${error}`);
            }

            const result: WavespeedResponse = await response.json();

            // Poll for completion if processing
            if (result.status === "processing") {
              const finalResult = await pollForCompletion(result.id, baseUrl, apiKey);
              return {
                success: true,
                images: Array.isArray(finalResult.output) ? finalResult.output : [finalResult.output],
                model,
                prediction_id: result.id,
              };
            }

            if (result.status === "failed") {
              throw new Error(`Generation failed: ${result.error || "Unknown error"}`);
            }

            return {
              success: true,
              images: Array.isArray(result.output) ? result.output : [result.output],
              model,
              prediction_id: result.id,
            };
          } catch (error) {
            console.error("[wavespeed] Image generation error:", error);
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error),
            };
          }
        },
      });

      /**
       * Tool: Generate Video
       *
       * Generate AI videos using models (Kling, Luma, Runway, Pika)
       */
      api.registerTool({
        name: "wavespeed_generate_video",
        description: `Generate AI videos using Wavespeed API.

Available models:
- ${MODELS.video.kling} (high quality, 5-10s)
- ${MODELS.video.luma_dream} (cinematic, 5s)
- ${MODELS.video.runway_gen3} (versatile, 5-10s)
- ${MODELS.video.pika} (fast, 3s)

Parameters:
- prompt (required): Text description of the video
- model (optional): Model to use (default: ${MODELS.video.kling})
- image_url (optional): Starting image for video-from-image
- duration (optional): Video duration in seconds (3-10)
- aspect_ratio (optional): 16:9, 9:16, 1:1

Returns: Video URL (mp4)`,

        parameters: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "Text description of the video to generate",
            },
            model: {
              type: "string",
              description: `Model to use (default: ${MODELS.video.kling})`,
              enum: Object.values(MODELS.video),
            },
            image_url: {
              type: "string",
              description: "Optional starting image URL for image-to-video",
            },
            duration: {
              type: "number",
              description: "Video duration in seconds (3-10)",
            },
            aspect_ratio: {
              type: "string",
              description: "Video aspect ratio",
              enum: ["16:9", "9:16", "1:1"],
            },
          },
          required: ["prompt"],
        },

        handler: async (args: GenerateVideoParams) => {
          try {
            const model = args.model || MODELS.video.kling;
            const payload = {
              input: {
                prompt: args.prompt,
                image: args.image_url,
                duration: args.duration || 5,
                aspect_ratio: args.aspect_ratio || "16:9",
                seed: args.seed,
              },
            };

            console.log(`[wavespeed] Generating video with ${model}...`);

            const response = await fetch(`${baseUrl}/predictions`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                version: model,
                ...payload,
              }),
            });

            if (!response.ok) {
              const error = await response.text();
              throw new Error(`Wavespeed API error (${response.status}): ${error}`);
            }

            const result: WavespeedResponse = await response.json();

            // Videos always require polling
            const finalResult = await pollForCompletion(result.id, baseUrl, apiKey, 120000);

            if (finalResult.status === "failed") {
              throw new Error(`Video generation failed: ${finalResult.error || "Unknown error"}`);
            }

            const videoUrl = Array.isArray(finalResult.output)
              ? finalResult.output[0]
              : finalResult.output;

            return {
              success: true,
              video_url: videoUrl,
              model,
              prediction_id: result.id,
              message: "Video generated successfully! Downloading...",
            };
          } catch (error) {
            console.error("[wavespeed] Video generation error:", error);
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error),
            };
          }
        },
      });

      console.log("[wavespeed] ✅ Registered 2 tools: wavespeed_generate_image, wavespeed_generate_video");
    },
  };
}

/**
 * Poll Wavespeed API for prediction completion
 */
async function pollForCompletion(
  predictionId: string,
  baseUrl: string,
  apiKey: string,
  maxWaitMs: number = 60000,
): Promise<WavespeedResponse> {
  const startTime = Date.now();
  const pollInterval = 2000; // 2 seconds

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(`${baseUrl}/predictions/${predictionId}`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to poll prediction: ${response.status}`);
    }

    const result: WavespeedResponse = await response.json();

    if (result.status === "succeeded" || result.status === "failed") {
      return result;
    }

    console.log(`[wavespeed] Prediction ${predictionId} still processing...`);
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Prediction timeout after ${maxWaitMs}ms`);
}

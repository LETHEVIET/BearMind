/**
 * Represents a Gemini AI model with its capabilities and rate limits
 * @property {string} name - The display name of the model
 * @property {string} id - The unique identifier used in API calls
 * @property {string} inputs - Supported input types for this model
 * @property {string} outputs - Supported output types for this model
 * @property {string} description - Detailed description of model capabilities
 * @property {object} rateLimits - API rate limits for this model
 */
export interface GeminiModel {
  name: string;
  id: string;
  inputs: string;
  outputs: string;
  description: string;
  rateLimits: {
    rpm: number | string; // Requests per minute
    tpm: number | string; // Tokens per minute
    rpd: number | string; // Requests per day
  };
}

/**
 * Complete list of available Gemini AI models with their capabilities and rate limits
 * Hover over a model in your IDE to see its description and capabilities
 */
export const geminiModels: GeminiModel[] = [
  {
    name: "Gemini 2.5 Pro Experimental",
    id: "gemini-2.5-pro-exp-03-25",
    inputs: "Audio, images, videos, and text",
    outputs: "Text",
    description: "Enhanced thinking and reasoning, multimodal understanding, advanced coding, and more",
    rateLimits: {
      rpm: 5,
      tpm: 1000000,
      rpd: 25
    }
  },
  {
    name: "Gemini 2.0 Flash",
    id: "gemini-2.0-flash",
    inputs: "Audio, images, videos, and text",
    outputs: "Text, images (experimental), and audio (coming soon)",
    description: "Next generation features, speed, thinking, realtime streaming, and multimodal generation",
    rateLimits: {
      rpm: 15,
      tpm: 1000000,
      rpd: 1500
    }
  },
  {
    name: "Gemini 2.0 Flash-Lite",
    id: "gemini-2.0-flash-lite",
    inputs: "Audio, images, videos, and text",
    outputs: "Text",
    description: "Cost efficiency and low latency",
    rateLimits: {
      rpm: 30,
      tpm: 1000000,
      rpd: 1500
    }
  },
  {
    name: "Gemini 1.5 Flash",
    id: "gemini-1.5-flash",
    inputs: "Audio, images, videos, and text",
    outputs: "Text",
    description: "Fast and versatile performance across a diverse variety of tasks",
    rateLimits: {
      rpm: 15,
      tpm: 1000000,
      rpd: 1500
    }
  },
  {
    name: "Gemini 1.5 Flash-8B",
    id: "gemini-1.5-flash-8b",
    inputs: "Audio, images, videos, and text",
    outputs: "Text",
    description: "High volume and lower intelligence tasks",
    rateLimits: {
      rpm: 15,
      tpm: 1000000,
      rpd: 1500
    }
  },
  {
    name: "Gemini 1.5 Pro",
    id: "gemini-1.5-pro",
    inputs: "Audio, images, videos, and text",
    outputs: "Text",
    description: "Complex reasoning tasks requiring more intelligence",
    rateLimits: {
      rpm: 2,
      tpm: 32000,
      rpd: 50
    }
  },
  // {
  //   name: "Gemini Embedding",
  //   id: "gemini-embedding-exp",
  //   inputs: "Text",
  //   outputs: "Text embeddings",
  //   description: "Measuring the relatedness of text strings",
  //   rateLimits: {
  //     rpm: 5,
  //     tpm: "--",
  //     rpd: 100
  //   }
  // },
  // {
  //   name: "Imagen 3",
  //   id: "imagen-3.0-generate-002",
  //   inputs: "Text",
  //   outputs: "Images",
  //   description: "Our most advanced image generation model",
  //   rateLimits: {
  //     rpm: "--",
  //     tpm: "--",
  //     rpd: "--"
  //   }
  // },
  {
    name: "Gemini 2.0 Flash Experimental",
    id: "gemini-2.0-flash-exp",
    inputs: "Audio, images, videos, and text",
    outputs: "Text, images (experimental)",
    description: "Image generation capabilities",
    rateLimits: {
      rpm: 10,
      tpm: 1000000,
      rpd: 1500
    }
  },
  {
    name: "Gemini 2.0 Flash Thinking Experimental",
    id: "gemini-2.0-flash-thinking-exp-01-21",
    inputs: "Audio, images, videos, and text",
    outputs: "Text",
    description: "Enhanced thinking capabilities",
    rateLimits: {
      rpm: 10,
      tpm: 4000000,
      rpd: 1500
    }
  },
  {
    name: "Gemma 3",
    id: "gemma-3",
    inputs: "Text",
    outputs: "Text",
    description: "Lightweight model for various tasks",
    rateLimits: {
      rpm: 30,
      tpm: 15000,
      rpd: 14400
    }
  }
];

/**
 * Retrieves a Gemini model by its API identifier
 * @param id - The model ID to look up
 * @returns The matching model or undefined if not found
 */
export const getModelById = (id: string): GeminiModel | undefined => {
  return geminiModels.find(model => model.id === id);
};

/**
 * Retrieves a Gemini model by its display name
 * @param name - The model name to look up
 * @returns The matching model or undefined if not found
 */
export const getModelByName = (name: string): GeminiModel | undefined => {
  return geminiModels.find(model => model.name === name);
};

/**
 * Generates formatted hover text for a model that can be used in tooltips
 * @param model - The model or model ID to generate hover text for
 * @returns Formatted string with model details for displaying in hover tooltip
 */
export const getModelHoverText = (model: string | GeminiModel): string => {
  const modelData = typeof model === 'string' 
    ? getModelById(model) || getModelByName(model)
    : model;
    
  if (!modelData) return 'Unknown model';
  
  return `
    Model: ${modelData.name} (${modelData.id})
    ----------------------------------------
    Description: ${modelData.description}
    Inputs: ${modelData.inputs}
    Outputs: ${modelData.outputs}
    
    Rate Limits:
    - ${modelData.rateLimits.rpm} requests per minute
    - ${modelData.rateLimits.tpm} tokens per minute
    - ${modelData.rateLimits.rpd} requests per day
  `.trim().replace(/\n\s+/g, '\n');
};
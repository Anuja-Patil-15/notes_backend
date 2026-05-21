import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const PROMPTS = {
  summary: (text) => `You are an expert academic summarizer. Analyze the following notes/document and provide a comprehensive yet concise summary. Structure it with:
- **Overview**: 2-3 sentence high-level summary
- **Key Topics**: Main subjects covered
- **Core Concepts**: Most important ideas explained briefly
- **Takeaways**: What the reader should remember

Notes/Document:
${text}`,

 mcq: (text) => `You are an expert educator and quiz creator. Based on the following notes/document, generate 10 multiple choice questions (MCQs) that test understanding of key concepts.

Return a valid JSON array where each object represents a question using exactly this structure:
[
  {
    "id": 1,
    "question": "What is the primary goal of the Vasculature Common Coordinate Framework (VCCF)?",
    "options": [
      "To develop new machine learning models for image segmentation.",
      "To create a comprehensive map of blood vessels in the human body.",
      "To reduce the manual effort required for data annotation.",
      "To generate high-resolution 3D images of intact organs."
    ],
    "correctAnswer": "B",
    "explanation": "The document states in the background section that 'Vasculature Common Coordinate Framework (VCCF) aims to create a comprehensive map of blood vessels in the human body'."
  }
]

Make questions varied in difficulty (easy, medium, hard). Focus on conceptual understanding, not trivia. 
Return ONLY the raw JSON array. Do not include markdown code block styling like \`\`\`json.

Notes/Document:
${text}`,

  flowchart: (text) => `You are an expert at analyzing processes and creating flow diagrams. Analyze the following notes/document and:

1. Identify if there are any processes, workflows, algorithms, or sequential steps described.
2. If processes exist, create a detailed flowchart in Mermaid.js format.
3. If no clear process flow exists, describe the conceptual relationships between topics as a mind map in Mermaid format.

Always wrap the diagram in \`\`\`mermaid code blocks.
After the diagram, provide a brief explanation of the flow.

Notes/Document:
${text}`,

  short_notes: (text) => `You are an expert study assistant. Convert the following notes/document into clean, well-structured short notes perfect for quick revision.

Format as:
# [Main Topic]

## [Subtopic 1]
- Key point 1
- Key point 2
- **Important term**: Definition

## [Subtopic 2]
...

Use bullet points, bold for important terms, and keep each point concise (1-2 lines max). Include any formulas, dates, or key figures mentioned.

Notes/Document:
${text}`,
};

export const generateAIContent = async (feature, extractedText) => {
  const prompt = PROMPTS[feature];
  if (!prompt) throw new Error(`Unknown feature: ${feature}`);

  const  model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent(prompt(extractedText.substring(0, 50000)));
  const response = await result.response;
  return response.text();
};

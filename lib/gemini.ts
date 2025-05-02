import { GoogleGenerativeAI } from "@google/generative-ai"

export interface GeminiResult {
  content: string
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "")

export async function geminiChatCompletion({
  prompt,
  systemPrompt,
  maxTokens = 1000,
  temperature = 0.1,
}: {
  prompt: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
}): Promise<GeminiResult> {
  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not set in environment variables")
  }
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
  const messages = [
    { role: "user", parts: [{ text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt }] }
  ]
  try {
    const result = await model.generateContent({ contents: messages, generationConfig: { maxOutputTokens: maxTokens, temperature } })
    const content = result.response.candidates?.[0]?.content?.parts?.[0]?.text || ""
    return { content }
  } catch (error) {
    throw new Error("Gemini API error: " + (error instanceof Error ? error.message : String(error)))
  }
} 
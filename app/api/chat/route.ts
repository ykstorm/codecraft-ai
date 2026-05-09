import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMIT_ERROR } from "@/lib/ratelimit";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  history: ChatMessage[];
}

async function generateAIResponse(messages: ChatMessage[]): Promise<string> {
  const systemPrompt = `You are a helpful AI coding assistant. You help developers with:
- Code explanations and debugging
- Best practices and architecture advice  
- Writing clean, efficient code
- Troubleshooting errors
- Code reviews and optimizations

Always provide clear, practical answers. Use proper code formatting when showing examples.`;

  const fullMessages = [{ role: "system", content: systemPrompt }, ...messages];

  const prompt = fullMessages
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n\n");

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "codellama:latest",
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 0.9,
        },
      }),
    });

    const data = await response.json();

    if (!data.response) {
      throw new Error("No response from AI model");
    }

    return data.response.trim();
  } catch (error) {
    console.error("AI generation error:", error);
    throw new Error("Failed to generate AI response");
  }
}

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { success, resetAt } = checkRateLimit(ip);

  if (!success) {
    return NextResponse.json(RATE_LIMIT_ERROR, {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
        "X-RateLimit-Remaining": "0",
      },
    });
  }

  try {
    const body: ChatRequest = await req.json();
    const { message, history = [] } = body;

    // Validate input
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    // Validate history format
    const validHistory = Array.isArray(history)
      ? history.filter(
          (msg) =>
            msg &&
            typeof msg === "object" &&
            typeof msg.role === "string" &&
            typeof msg.content === "string" &&
            ["user", "assistant"].includes(msg.role)
        )
      : [];

    const recentHistory = validHistory.slice(-10);

    const messages: ChatMessage[] = [
      ...recentHistory,
      { role: "user", content: message },
    ];

    // Generate AI response
    const aiResponse = await generateAIResponse(messages);

    return NextResponse.json({
      response: aiResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Chat API Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to generate AI response",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
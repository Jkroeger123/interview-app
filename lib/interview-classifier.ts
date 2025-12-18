import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ClassificationResult {
  shouldCharge: boolean;
  reason: string;
  confidence: "high" | "medium" | "low";
}

export interface InterviewMetadata {
  interviewId: string;
  plannedDurationMinutes: number;
  actualDurationSeconds: number;
  endedBy: string | null;
  transcriptWordCount: number;
  transcriptTurnCount: number;
}

/**
 * Classify interview success using OpenAI
 * 
 * Determines if an interview was successful enough to charge credits.
 * 
 * Charging criteria:
 * 1. User-ended AND >50% duration → Always charge (user got practice)
 * 2. System/error-ended OR <50% → Ask OpenAI to analyze quality
 * 
 * OpenAI looks for:
 * - Real conversation between interviewer and user
 * - Multiple question-answer exchanges
 * - Meaningful dialogue (not just errors/confusion)
 * - Evidence of practice value
 */
export async function classifyInterviewSuccess(
  transcript: string,
  metadata: InterviewMetadata
): Promise<ClassificationResult> {
  console.log(`🤖 Classifying interview ${metadata.interviewId}`);
  console.log(`📊 Metadata:`, {
    planned: metadata.plannedDurationMinutes,
    actual: metadata.actualDurationSeconds,
    endedBy: metadata.endedBy,
    words: metadata.transcriptWordCount,
    turns: metadata.transcriptTurnCount,
  });

  // Calculate duration percentage
  const plannedSeconds = metadata.plannedDurationMinutes * 60;
  const durationPercentage = (metadata.actualDurationSeconds / plannedSeconds) * 100;

  // Rule 1: User-ended AND >50% duration → Always charge
  if (metadata.endedBy === "user" && durationPercentage >= 50) {
    return {
      shouldCharge: true,
      reason: `User completed ${Math.round(durationPercentage)}% of planned interview and chose to end it. User received practice value.`,
      confidence: "high",
    };
  }

  // Rule 2: Very short interviews (<30 seconds) → Never charge
  if (metadata.actualDurationSeconds < 30) {
    return {
      shouldCharge: false,
      reason: `Interview too short (${metadata.actualDurationSeconds}s). Likely technical issue or immediate disconnect.`,
      confidence: "high",
    };
  }

  // Rule 3: No transcript or very few words → Never charge
  if (metadata.transcriptWordCount < 20) {
    return {
      shouldCharge: false,
      reason: `Insufficient dialogue (${metadata.transcriptWordCount} words). No meaningful conversation occurred.`,
      confidence: "high",
    };
  }

  // Rule 4: System/error ended OR <50% duration → Use AI to analyze quality
  console.log("🧠 Using OpenAI to analyze interview quality...");

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an interview quality classifier. Your job is to determine if a visa interview practice session was valuable enough to charge the user credits.

Analyze the transcript and determine:
1. Did a real conversation happen between interviewer (agent) and user?
2. Were there meaningful question-answer exchanges?
3. Did the user get practice value from this session?

Consider these factors:
- Multiple back-and-forth exchanges (good)
- User answering interview questions (good)
- Only greetings then disconnect (bad - no charge)
- Confusion/errors without substance (bad - no charge)
- Brief but meaningful practice (good - charge)
- Technical issues preventing dialogue (bad - no charge)

Return JSON only:
{
  "shouldCharge": boolean,
  "reason": "Brief explanation (1-2 sentences)",
  "confidence": "high" | "medium" | "low"
}`,
        },
        {
          role: "user",
          content: `Interview Metadata:
- Planned Duration: ${metadata.plannedDurationMinutes} minutes
- Actual Duration: ${Math.round(metadata.actualDurationSeconds / 60)} minutes (${durationPercentage.toFixed(1)}%)
- Ended By: ${metadata.endedBy || "unknown"}
- Word Count: ${metadata.transcriptWordCount}
- Turn Count: ${metadata.transcriptTurnCount}

Transcript:
${transcript}

Should we charge the user for this interview?`,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(
      completion.choices[0]?.message?.content || "{}"
    ) as ClassificationResult;

    console.log("✅ OpenAI classification:", result);
    return result;
  } catch (error) {
    console.error("❌ OpenAI classification error:", error);

    // Fallback: If AI fails, use heuristics
    // If got >30% duration with some dialogue, charge
    const fallbackCharge = durationPercentage >= 30 && metadata.transcriptWordCount >= 50;

    return {
      shouldCharge: fallbackCharge,
      reason: fallbackCharge
        ? `AI classification unavailable. Based on ${Math.round(durationPercentage)}% completion and ${metadata.transcriptWordCount} words, charging for practice value.`
        : `AI classification unavailable. Based on ${Math.round(durationPercentage)}% completion and ${metadata.transcriptWordCount} words, not charging.`,
      confidence: "low",
    };
  }
}

/**
 * Build transcript string from segments
 */
export function buildTranscriptFromSegments(
  segments: Array<{ speaker: string; text: string }>
): string {
  return segments.map((seg) => `${seg.speaker}: ${seg.text}`).join("\n");
}

/**
 * Calculate transcript statistics
 */
export function calculateTranscriptStats(transcript: string): {
  wordCount: number;
  turnCount: number;
} {
  const words = transcript.split(/\s+/).filter((w) => w.length > 0);
  const turns = transcript.split("\n").filter((line) => line.trim().length > 0);

  return {
    wordCount: words.length,
    turnCount: turns.length,
  };
}




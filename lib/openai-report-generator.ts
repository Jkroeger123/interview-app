import OpenAI from "openai";

export interface AIReportData {
  performanceRating: 1 | 2 | 3 | 4 | 5; // Star rating (1-5)
  strengths: string[];
  weaknesses: string[];
  redFlags: Array<{
    timestamp: string;
    description: string;
  }>;
  timestampedComments: Array<{
    timestamp: string;
    comment: string;
    severity: "positive" | "neutral" | "concern";
  }>;
  summary: string;
}

/**
 * Generate AI-powered interview analysis report
 */
export async function generateReport(
  transcript: string,
  visaType: string,
  interviewContext?: string
): Promise<AIReportData> {
  const systemPrompt = `You are an expert interview coach analyzing mock visa interview transcripts. Your role is to provide constructive feedback to help applicants improve their interview performance.

CRITICAL: This is a PRACTICE interview ONLY. You are evaluating INTERVIEW PERFORMANCE based on established guidelines. Do NOT speculate about visa approval outcomes or use language like "likely approved" or "likely denied" for legal reasons.

Your feedback should be:
- Constructive and educational
- Specific and actionable
- Objective and evidence-based
- Focused on measurable performance criteria

Analyze the interview transcript and provide detailed feedback covering:
1. Performance rating (1-5 stars) based on interview performance quality
   - ⭐⭐⭐⭐⭐ (5 stars): Strong Performance - Demonstrates excellent preparation and communication
   - ⭐⭐⭐⭐ (4 stars): Above Average Performance - Shows good preparation with minor areas to improve
   - ⭐⭐⭐ (3 stars): Adequate Performance - Meets basic standards but needs improvement
   - ⭐⭐ (2 stars): Below Average Performance - Significant gaps in preparation or communication
   - ⭐ (1 star): Weak Performance - Major deficiencies requiring substantial improvement
2. Key strengths demonstrated
3. Areas for improvement (weaknesses)
4. Red flags or concerning responses
5. Timestamped specific comments on notable moments
6. Executive summary with actionable advice

Evaluate based on these performance criteria:
- Clarity and confidence in responses
- Consistency of information
- Evidence provided for claims (study/visit/work plans)
- Financial documentation and preparedness
- Demonstrated ties to home country
- Communication skills and articulation
- Completeness and specificity of answers
- Ability to provide supporting details when requested

Use objective performance language like "strong," "adequate," or "weak" rather than predicting approval outcomes.`;

  const userPrompt = `Please analyze this ${visaType} visa interview transcript and provide a comprehensive performance evaluation.

${interviewContext ? `Interview Context:\n${interviewContext}\n\n` : ""}Transcript:
${transcript}

Provide your analysis in the following JSON format:
{
  "performanceRating": <number 1-5>,
  "strengths": ["<strength1>", "<strength2>", ...],
  "weaknesses": ["<weakness1>", "<weakness2>", ...],
  "redFlags": [
    {
      "timestamp": "MM:SS",
      "description": "<description of concern>"
    }
  ],
  "timestampedComments": [
    {
      "timestamp": "MM:SS",
      "comment": "<specific feedback>",
      "severity": "<positive|neutral|concern>"
    }
  ],
  "summary": "<2-3 paragraph executive summary with specific actionable advice>"
}

Guidelines:
- performanceRating is 1-5 stars reflecting interview performance quality against established criteria
- Use objective performance language: "strong," "adequate," "weak," "demonstrates," "lacks"
- NEVER use approval prediction language like "likely approved/denied" or "chances of approval"
- Include 3-5 strengths demonstrated during the interview
- Include 3-5 weaknesses (specific areas needing improvement)
- Flag major performance concerns as redFlags (e.g., inconsistent statements, missing documentation evidence)
- Provide 5-10 timestamped comments highlighting key performance moments
- Summary should be objective, encouraging, and focus on concrete improvement steps
- Focus on interview performance quality, NOT visa approval prediction`;

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const report = JSON.parse(content) as AIReportData;

    // Validate the report structure
    if (
      typeof report.performanceRating !== "number" ||
      !Array.isArray(report.strengths) ||
      !Array.isArray(report.weaknesses) ||
      !Array.isArray(report.redFlags) ||
      !Array.isArray(report.timestampedComments) ||
      !report.summary
    ) {
      throw new Error("Invalid report structure from OpenAI");
    }

    // Ensure performance rating is within bounds
    report.performanceRating = Math.max(1, Math.min(5, Math.round(report.performanceRating))) as 1 | 2 | 3 | 4 | 5;

    console.log("✅ Generated AI report with performance rating:", report.performanceRating);
    return report;
  } catch (error) {
    console.error("❌ Error generating AI report:", error);
    throw new Error(
      `Failed to generate AI report: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Validate that a timestamp is in the correct format
 */
function isValidTimestamp(timestamp: string): boolean {
  return /^\d{1,2}:\d{2}$/.test(timestamp);
}


import OpenAI from "openai";

export interface AIReportData {
  overallScore: number;
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
  const systemPrompt = `You are an expert U.S. visa officer AI assistant tasked with analyzing mock visa interview transcripts. Your role is to provide constructive feedback to help applicants improve their interview performance.

CRITICAL LEGAL DISCLAIMER: This is a PRACTICE interview ONLY. You are NOT predicting actual visa approval. You are rating the applicant's INTERVIEW PERFORMANCE, not their visa eligibility.

Your feedback should be:
- Constructive and educational
- Specific and actionable
- Fair but realistic
- Focused on helping them improve their interview skills

Analyze the interview transcript and provide detailed feedback covering:
1. Overall performance score (0-100)
2. Performance rating (1-5 stars) based on interview technique, NOT visa approval likelihood
   - ⭐⭐⭐⭐⭐ (5 stars): Excellent interview performance
   - ⭐⭐⭐⭐ (4 stars): Good interview performance
   - ⭐⭐⭐ (3 stars): Satisfactory performance with room for improvement
   - ⭐⭐ (2 stars): Needs significant improvement
   - ⭐ (1 star): Poor performance, major concerns
3. Key strengths demonstrated
4. Areas for improvement (weaknesses)
5. Red flags or concerning responses
6. Timestamped specific comments on notable moments
7. Executive summary with actionable advice

Consider these evaluation criteria:
- Clarity and confidence in responses
- Consistency of information
- Evidence of genuine intent (study/visit/work as appropriate)
- Financial preparedness
- Ties to home country
- Communication skills
- Completeness of answers
- Ability to provide specific details when asked`;

  const userPrompt = `Please analyze this ${visaType} visa interview transcript and provide a comprehensive evaluation report.

${interviewContext ? `Interview Context:\n${interviewContext}\n\n` : ""}Transcript:
${transcript}

Provide your analysis in the following JSON format:
{
  "overallScore": <number 0-100>,
  "performanceRating": <number 1-5>,
  "strengths": ["<strength1>", "<strength2>", ...],
  "weaknesses": ["<weakness1>", "<weakness2>", ...],
  "redFlags": [
    {
      "timestamp": "MM:SS",
      "description": "<description of red flag>"
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
- overallScore should reflect realistic visa interview performance standards (0-100)
- performanceRating is 1-5 stars based on interview technique ONLY (NOT visa approval prediction)
- Include 3-5 strengths
- Include 3-5 weaknesses (areas for improvement)
- Flag any major concerns as redFlags
- Provide 5-10 timestamped comments highlighting key moments
- Summary should be encouraging but honest, with concrete next steps
- REMEMBER: You are rating INTERVIEW PERFORMANCE, not predicting visa approval`;

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
      typeof report.overallScore !== "number" ||
      typeof report.performanceRating !== "number" ||
      !Array.isArray(report.strengths) ||
      !Array.isArray(report.weaknesses) ||
      !Array.isArray(report.redFlags) ||
      !Array.isArray(report.timestampedComments) ||
      !report.summary
    ) {
      throw new Error("Invalid report structure from OpenAI");
    }

    // Ensure scores are within bounds
    report.overallScore = Math.max(0, Math.min(100, report.overallScore));
    report.performanceRating = Math.max(1, Math.min(5, Math.round(report.performanceRating))) as 1 | 2 | 3 | 4 | 5;

    console.log("✅ Generated AI report with score:", report.overallScore);
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


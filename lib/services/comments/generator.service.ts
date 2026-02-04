import { CommentTone, FomoTriggerType, Platform } from "@prisma/client";

export interface GenerateCommentInput {
  postContent?: string;
  postUrl?: string;
  platform: Platform;
  tone: CommentTone;
  fomoType?: FomoTriggerType;
  templateContent?: string;
  productName?: string;
  callToAction?: string;
  maxLength?: number;
  variations?: number;
}

export interface GeneratedComment {
  content: string;
  tone: CommentTone;
  fomoType?: FomoTriggerType;
  confidence: number;
}

export class GeneratorService {
  private readonly TONE_PROMPTS: Record<CommentTone, string> = {
    FRIENDLY: "warm, approachable, and conversational with a friendly emoji",
    PROFESSIONAL: "polished, knowledgeable, and authoritative without being cold",
    CASUAL: "relaxed, relatable, and using casual internet speak",
    URGENT: "creating immediate interest with time-sensitive language",
    FOMO: "triggering fear of missing out with scarcity and social proof",
  };

  private readonly FOMO_PROMPTS: Record<FomoTriggerType, string> = {
    SCARCITY: "emphasize limited availability, running out, or exclusive access",
    URGENCY: "create time pressure with deadlines, expiring offers, or immediate action needed",
    SOCIAL_PROOF: "highlight how many others are using, buying, or benefiting from this",
    EXCLUSIVITY: "make them feel special, part of an insider group, or getting VIP treatment",
  };

  private readonly PLATFORM_GUIDELINES: Record<Platform, { maxLength: number; style: string }> = {
    INSTAGRAM: {
      maxLength: 150,
      style: "Use emojis naturally, be visual-minded, hashtags optional",
    },
    TIKTOK: {
      maxLength: 100,
      style: "Super casual, use trending phrases, be energetic and youthful",
    },
    TWITTER: {
      maxLength: 200,
      style: "Concise and punchy, can be witty or provocative",
    },
    FACEBOOK: {
      maxLength: 200,
      style: "Conversational and community-focused",
    },
    LINKEDIN: {
      maxLength: 200,
      style: "Professional but personable, value-driven",
    },
    YOUTUBE: {
      maxLength: 300,
      style: "Engaging and comment-worthy, can ask questions",
    },
  };

  async generate(input: GenerateCommentInput): Promise<GeneratedComment[]> {
    const provider = this.getAIProvider();
    const variations = input.variations ?? 3;
    const platformConfig = this.PLATFORM_GUIDELINES[input.platform];

    const prompt = this.buildPrompt(input, platformConfig);

    try {
      const comments = await this.callAI(provider, prompt, variations);
      return comments.map((content) => ({
        content: content.slice(0, input.maxLength ?? platformConfig.maxLength),
        tone: input.tone,
        fomoType: input.fomoType,
        confidence: this.calculateConfidence(content, input),
      }));
    } catch (error) {
      console.error("AI generation failed:", error);
      // Fallback to template-based generation
      return this.generateFromTemplate(input);
    }
  }

  private getAIProvider(): "openai" | "anthropic" | "fallback" {
    if (process.env.OPENAI_API_KEY) return "openai";
    if (process.env.ANTHROPIC_API_KEY) return "anthropic";
    return "fallback";
  }

  private buildPrompt(
    input: GenerateCommentInput,
    platformConfig: { maxLength: number; style: string }
  ): string {
    const parts: string[] = [
      `Generate a social media comment for ${input.platform}.`,
      `Tone: ${this.TONE_PROMPTS[input.tone]}`,
      `Style guidelines: ${platformConfig.style}`,
      `Maximum length: ${input.maxLength ?? platformConfig.maxLength} characters`,
    ];

    if (input.fomoType) {
      parts.push(`FOMO trigger: ${this.FOMO_PROMPTS[input.fomoType]}`);
    }

    if (input.postContent) {
      parts.push(`Post context: ${input.postContent.slice(0, 500)}`);
    }

    if (input.productName) {
      parts.push(`Product/Service: ${input.productName}`);
    }

    if (input.callToAction) {
      parts.push(`Include call to action: ${input.callToAction}`);
    }

    if (input.templateContent) {
      parts.push(`Base template for inspiration: ${input.templateContent}`);
    }

    parts.push(
      "Generate a natural, engaging comment that doesn't look like spam or AI-generated content."
    );

    return parts.join("\n");
  }

  private async callAI(
    provider: "openai" | "anthropic" | "fallback",
    prompt: string,
    variations: number
  ): Promise<string[]> {
    if (provider === "openai") {
      return this.callOpenAI(prompt, variations);
    } else if (provider === "anthropic") {
      return this.callAnthropic(prompt, variations);
    } else {
      throw new Error("No AI provider configured");
    }
  }

  private async callOpenAI(prompt: string, variations: number): Promise<string[]> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a social media engagement expert. Generate natural, human-like comments that drive engagement without being spammy.",
          },
          {
            role: "user",
            content: `${prompt}\n\nGenerate ${variations} different variations, each on a new line. Only output the comments, nothing else.`,
          },
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content ?? "";
    return content
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .slice(0, variations);
  }

  private async callAnthropic(prompt: string, variations: number): Promise<string[]> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `${prompt}\n\nGenerate ${variations} different variations, each on a new line. Only output the comments, nothing else.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text ?? "";
    return content
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .slice(0, variations);
  }

  private generateFromTemplate(input: GenerateCommentInput): GeneratedComment[] {
    // Fallback template-based generation when AI is not available
    const templates: Record<CommentTone, string[]> = {
      FRIENDLY: [
        "This is exactly what I needed to see today! 🙌",
        "Love this! Thanks for sharing 💕",
        "So helpful, appreciate you posting this!",
      ],
      PROFESSIONAL: [
        "Great insights here. Very valuable perspective.",
        "This aligns well with current market trends.",
        "Excellent point. Worth considering for anyone in this space.",
      ],
      CASUAL: [
        "no way this is actually so good",
        "lol same honestly",
        "ok but this is actually fire 🔥",
      ],
      URGENT: [
        "Don't miss this! Limited time only ⏰",
        "Act fast before it's gone!",
        "This won't last long - grab it now!",
      ],
      FOMO: [
        "Everyone's been talking about this! Had to check it out 👀",
        "Can't believe I almost missed this!",
        "So glad I didn't wait - this is incredible!",
      ],
    };

    const baseTemplates = templates[input.tone] || templates.FRIENDLY;

    return baseTemplates.map((content) => ({
      content,
      tone: input.tone,
      fomoType: input.fomoType,
      confidence: 0.5, // Lower confidence for template-based
    }));
  }

  private calculateConfidence(content: string, input: GenerateCommentInput): number {
    let confidence = 0.7; // Base confidence

    // Adjust based on content quality indicators
    const platformConfig = this.PLATFORM_GUIDELINES[input.platform];

    // Length appropriateness
    if (content.length <= platformConfig.maxLength && content.length > 20) {
      confidence += 0.1;
    }

    // Has appropriate tone markers
    if (input.tone === CommentTone.FRIENDLY && /[😀😊🙌💕❤️]/.test(content)) {
      confidence += 0.05;
    }

    // Not too promotional
    if (!/click here|buy now|free gift/i.test(content)) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  async generateVariations(
    baseContent: string,
    count: number = 3
  ): Promise<string[]> {
    const provider = this.getAIProvider();

    if (provider === "fallback") {
      // Simple variation without AI
      return [
        baseContent,
        baseContent.replace(/!/g, "!!"),
        baseContent + " 🔥",
      ].slice(0, count);
    }

    try {
      return await this.callAI(
        provider,
        `Create ${count} natural variations of this comment, keeping the same meaning but varying the wording: "${baseContent}"`,
        count
      );
    } catch {
      return [baseContent];
    }
  }
}

export const generatorService = new GeneratorService();

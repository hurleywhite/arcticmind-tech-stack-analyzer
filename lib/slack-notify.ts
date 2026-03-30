import { FeedData } from "./feed-types";

export async function sendSlackFeedHighlights(
  webhookUrl: string,
  feed: FeedData,
  companyName: string
): Promise<boolean> {
  if (!webhookUrl) return false;

  try {
    const blocks: Record<string, unknown>[] = [
      {
        type: "header",
        text: { type: "plain_text", text: `📰 ArcticPulse Daily — ${companyName}`, emoji: true },
      },
      { type: "divider" },
    ];

    // Top 3 AI trends
    const topArticles = (feed.ai_trends || []).slice(0, 3);
    if (topArticles.length > 0) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*AI Trends*",
        },
      });

      for (const article of topArticles) {
        const link = article.url ? `<${article.url}|${article.title}>` : article.title;
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${link}\n${article.summary || ""}`,
          },
        });
      }
    }

    // Top 2 tool updates
    const topTools = (feed.tool_updates || []).slice(0, 2);
    if (topTools.length > 0) {
      blocks.push({ type: "divider" });
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: "*Tool Updates*" },
      });

      for (const tool of topTools) {
        const link = tool.url ? `<${tool.url}|${tool.title}>` : tool.title;
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${link}\n${tool.summary || ""}`,
          },
        });
      }
    }

    blocks.push({ type: "divider" });
    blocks.push({
      type: "context",
      elements: [
        { type: "mrkdwn", text: `Sent by <https://arcticmind-tech-stack-analyzer.vercel.app|ArcticPulse> · ${new Date().toLocaleDateString()}` },
      ],
    });

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });

    return response.ok;
  } catch (error) {
    console.error("Slack notify error:", error);
    return false;
  }
}

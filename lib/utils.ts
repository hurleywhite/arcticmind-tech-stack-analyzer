export function extractCompanyName(url: string): string {
  // Remove protocol
  let domain = url.replace(/^https?:\/\//, "").replace(/^www\./, "");
  // Remove path, query, hash
  domain = domain.split("/")[0].split("?")[0].split("#")[0];
  // Get the company name from the domain (e.g., "snowflake.com" -> "snowflake")
  const parts = domain.split(".");
  // Handle cases like "jobs.lever.co" or "boards.greenhouse.io"
  if (parts.length > 2) {
    return parts[parts.length - 2];
  }
  return parts[0];
}

export function extractDomain(input: string): string {
  let domain = input.trim().replace(/^https?:\/\//, "").replace(/^www\./, "");
  domain = domain.split("/")[0].split("?")[0].split("#")[0];
  // If no dots (user typed "Snowflake"), add .com
  if (!domain.includes(".")) {
    domain = domain.toLowerCase().replace(/\s+/g, "") + ".com";
  }
  return domain.toLowerCase();
}

export function getConfidence(jobCount: number): "high" | "medium" | "low" {
  if (jobCount >= 15) return "high";
  if (jobCount >= 5) return "medium";
  return "low";
}

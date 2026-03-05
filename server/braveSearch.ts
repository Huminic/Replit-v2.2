const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY;
const BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search";

export interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
}

export async function braveWebSearch(query: string, count: number = 3): Promise<BraveSearchResult[]> {
  if (!BRAVE_API_KEY) {
    return [{ title: "Search unavailable", url: "", description: "Brave Search API key not configured." }];
  }

  const params = new URLSearchParams({
    q: query,
    count: String(count),
    text_decorations: "false",
    search_lang: "en",
  });

  const response = await fetch(`${BRAVE_SEARCH_URL}?${params}`, {
    headers: {
      "Accept": "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": BRAVE_API_KEY,
    },
  });

  if (!response.ok) {
    console.error(`Brave Search error: ${response.status} ${response.statusText}`);
    return [{ title: "Search failed", url: "", description: `Search API returned ${response.status}` }];
  }

  const data = await response.json();
  const webResults = data.web?.results || [];

  return webResults.slice(0, count).map((r: any) => ({
    title: r.title || "",
    url: r.url || "",
    description: r.description || "",
  }));
}

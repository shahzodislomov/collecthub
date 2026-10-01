import axios from "axios"
import * as cheerio from "cheerio"

export async function fetchOgData(url) {
    try {
        const { data } = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible: CollectHubBot/1.0"
            },
            timeout: 5000,
        })
        const $ = cheerio.load(data)
        const title = $("meta[property='og:title']").attr("content") || $("title").text().trim();
        const description = $("meta[property='og:description']").attr("content") || $("meta[name='description']").attr("content") || "";
        const imageUrl = $("meta[property='og:image']").attr("content") || $("meta[property='twitter:image']").attr("content") || null;
        const siteName = $("meta[property='og:site_name']").attr("content") || null;
        return {
            title: title ? title.trim() : null,
            description: description ? description.trim() : null,
            imageUrl: imageUrl ? imageUrl : null,
            siteName: siteName ? siteName.trim() : null,
        }
    } catch (error) {
        console.error(`Failed to scraoe OG data for ${url}:`, error.message);
        return null;
    }
}
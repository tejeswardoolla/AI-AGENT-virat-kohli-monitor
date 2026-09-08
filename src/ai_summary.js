import { config } from './config.js';

/**
 * Generates an executive summary & commentary for the statistics monitoring report.
 * Works out-of-the-box with structured rule-based synthesis, or enhances with AI if GEMINI_API_KEY is provided.
 * @param {Object} report Comparison report from comparator.js
 * @param {Object} latestData Scraped live data object
 * @returns {Promise<Object>} Object containing headline, summary, and bullet points
 */
export async function generateSummary(report, latestData) {
  // If Gemini API key is configured, attempt AI summary generation
  if (process.env.GEMINI_API_KEY) {
    try {
      const aiResult = await fetchGeminiSummary(report, latestData);
      if (aiResult) return aiResult;
    } catch (err) {
      console.warn('⚠️ Gemini AI API call failed, falling back to rule-based summary generator:', err.message);
    }
  }

  // Rule-based summary generation engine (Default & Fallback)
  return generateRuleBasedSummary(report, latestData);
}

/**
 * Rule-based summary synthesizer (Zero API key required, 100% reliable)
 */
function generateRuleBasedSummary(report, latestData) {
  const stats = latestData.stats || {};

  if (report.isFirstRun) {
    return {
      headline: '📊 Initial Statistics Baseline Established',
      summaryParagraph: 'The Virat Kohli Statistics Monitoring Agent has established a complete baseline across Test, ODI, T20I, and IPL formats.',
      highlights: [
        `**Test**: ${stats.test?.matches || 0} Matches | ${stats.test?.runs || 0} Runs | ${stats.test?.centuries || 0} Hundreds | Avg ${stats.test?.average || 'N/A'}`,
        `**ODI**: ${stats.odi?.matches || 0} Matches | ${stats.odi?.runs || 0} Runs | ${stats.odi?.centuries || 0} Hundreds | Avg ${stats.odi?.average || 'N/A'}`,
        `**T20I**: ${stats.t20i?.matches || 0} Matches | ${stats.t20i?.runs || 0} Runs | ${stats.t20i?.centuries || 0} Hundreds | Avg ${stats.t20i?.average || 'N/A'}`,
        `**IPL**: ${stats.ipl?.matches || 0} Matches | ${stats.ipl?.runs || 0} Runs | ${stats.ipl?.centuries || 0} Hundreds | Avg ${stats.ipl?.average || 'N/A'}`
      ]
    };
  }

  if (!report.hasChanges) {
    return {
      headline: '⚡ Daily Status: No New Statistics Updates Today',
      summaryParagraph: 'Virat Kohli\'s statistics remain unchanged across all formats since the last monitoring check.',
      highlights: [
        `**Test Career**: ${stats.test?.runs} Runs in ${stats.test?.matches} Matches (${stats.test?.centuries} Hundreds)`,
        `**ODI Career**: ${stats.odi?.runs} Runs in ${stats.odi?.matches} Matches (${stats.odi?.centuries} Hundreds)`,
        `**T20I Career**: ${stats.t20i?.runs} Runs in ${stats.t20i?.matches} Matches`,
        `**IPL Career**: ${stats.ipl?.runs} Runs in ${stats.ipl?.matches} Matches`
      ]
    };
  }

  // Active changes detected
  const changedFmtsText = report.formatsChanged.map(f => f.toUpperCase()).join(', ');
  const headline = `🔥 Stat Update: Changes Detected in ${changedFmtsText}!`;
  
  const highlights = [];

  report.formatsChanged.forEach((fmt) => {
    const changes = report.formatChanges[fmt];
    const fmtLabel = fmt.toUpperCase();

    if (changes.runs) {
      highlights.push(`**${fmtLabel} Runs**: ${changes.runs.old.toLocaleString()} ➔ **${changes.runs.new.toLocaleString()}** (+${changes.runs.delta} runs)`);
    }
    if (changes.centuries) {
      highlights.push(`**${fmtLabel} Hundreds**: ${changes.centuries.old} ➔ **${changes.centuries.new}** (+${changes.centuries.delta})`);
    }
    if (changes.halfCenturies) {
      highlights.push(`**${fmtLabel} Fifties**: ${changes.halfCenturies.old} ➔ **${changes.halfCenturies.new}** (+${changes.halfCenturies.delta})`);
    }
    if (changes.matches) {
      highlights.push(`**${fmtLabel} Matches**: ${changes.matches.old} ➔ **${changes.matches.new}** (+${changes.matches.delta})`);
    }
    if (changes.average) {
      highlights.push(`**${fmtLabel} Batting Average**: ${changes.average.old} ➔ **${changes.average.new}** (${changes.average.delta >= 0 ? '+' : ''}${changes.average.delta})`);
    }
  });

  if (report.milestones && report.milestones.length > 0) {
    report.milestones.forEach((m) => {
      highlights.unshift(`**${m.title}**: ${m.description}`);
    });
  }

  return {
    headline,
    summaryParagraph: `Fresh career updates detected for Virat Kohli in ${changedFmtsText}.`,
    highlights
  };
}

/**
 * Optional Gemini API Summary Generator
 */
async function fetchGeminiSummary(report, latestData) {
  // If user configures GEMINI_API_KEY, this function calls Google Gemini REST API
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const prompt = `You are a sports analyst. Generate a concise 2-sentence cricket summary for Virat Kohli's statistics report:
Report Data: ${JSON.stringify(report)}
Latest Stats: ${JSON.stringify(latestData.stats)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!res.ok) return null;
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  const ruleSummary = generateRuleBasedSummary(report, latestData);
  return {
    ...ruleSummary,
    summaryParagraph: text.trim()
  };
}

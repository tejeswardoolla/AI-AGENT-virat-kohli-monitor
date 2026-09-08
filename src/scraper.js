import axios from 'axios';
import * as cheerio from 'cheerio';
import { config } from './config.js';

/**
 * Helper to pause execution for a given number of milliseconds
 * @param {number} ms 
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Parses numeric strings (e.g. "9,230" -> 9230, "46.85" -> 46.85, "-" -> null)
 * @param {string} val 
 * @param {boolean} isFloat
 * @returns {number|null}
 */
function parseNumber(val, isFloat = false) {
  if (val === undefined || val === null || val === '' || val === '-') return null;
  const cleanStr = String(val).replace(/,/g, '').trim();
  const num = isFloat ? parseFloat(cleanStr) : parseInt(cleanStr, 10);
  return isNaN(num) ? null : num;
}

/**
 * Normalizes and sanitizes format statistics according to the master schema.
 * Ensures default null values and strict typing across all fields.
 * @param {Object} rawFormatStats 
 * @returns {Object} Strictly normalized format stats
 */
export function normalizeStatsData(rawFormatStats) {
  const formats = ['test', 'odi', 't20i', 'ipl'];
  const normalized = {};

  formats.forEach((fmt) => {
    const raw = rawFormatStats[fmt] || {};

    normalized[fmt] = {
      matches: parseNumber(raw.matches),
      innings: parseNumber(raw.innings),
      runs: parseNumber(raw.runs),
      ballsFaced: parseNumber(raw.ballsFaced),
      highestScore: raw.highestScore ? String(raw.highestScore).trim() : null,
      average: parseNumber(raw.average, true),
      strikeRate: parseNumber(raw.strikeRate, true),
      notOuts: parseNumber(raw.notOuts),
      fours: parseNumber(raw.fours),
      sixes: parseNumber(raw.sixes),
      ducks: parseNumber(raw.ducks),
      halfCenturies: parseNumber(raw.halfCenturies),
      centuries: parseNumber(raw.centuries),
      doubleCenturies: parseNumber(raw.doubleCenturies)
    };
  });

  return normalized;
}

/**
 * Scrapes live batting statistics for Virat Kohli from Cricbuzz with retry & error handling.
 * @param {number} maxRetries Maximum retry attempts on network/server errors (default: 3)
 * @returns {Promise<Object>} Formatted statistics object matching schema
 */
export async function scrapeKohliStats(maxRetries = 3) {
  const url = config.profileUrl;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 Fetching live stats from Cricbuzz (Attempt ${attempt}/${maxRetries}): ${url}`);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        timeout: 15000
      });

      if (!response.data || typeof response.data !== 'string') {
        throw new Error('Received empty or invalid HTML response from Cricbuzz.');
      }

      const $ = cheerio.load(response.data);

      const formatStats = {
        test: {},
        odi: {},
        t20i: {},
        ipl: {}
      };

      let battingTableFound = false;

      $('table').each((_, tableEl) => {
        if (battingTableFound) return;

        const rows = $(tableEl).find('tr');
        let isBatting = false;

        rows.each((_, tr) => {
          const firstCellText = $(tr).find('th, td').first().text().trim().toLowerCase();
          if (firstCellText === '100s' || firstCellText === '50s' || firstCellText === 'highest') {
            isBatting = true;
          }
        });

        if (isBatting) {
          battingTableFound = true;
          rows.each((_, tr) => {
            const cells = $(tr).find('th, td').map((_, cell) => $(cell).text().trim()).get();
            if (cells.length >= 5) {
              const label = cells[0].toLowerCase();
              mapBattingRow(label, [cells[1], cells[2], cells[3], cells[4]], formatStats);
            }
          });
        }
      });

      if (!battingTableFound) {
        throw new Error('Structural Validation Error: Batting Statistics table not found in Cricbuzz HTML.');
      }

      // Apply strict schema normalization
      const normalizedFormats = normalizeStatsData(formatStats);

      // Structural Integrity Guard: ensure at least Test or ODI has valid scraped runs
      const hasValidData = (normalizedFormats.test.runs && normalizedFormats.test.runs > 0) ||
                           (normalizedFormats.odi.runs && normalizedFormats.odi.runs > 0);

      if (!hasValidData) {
        throw new Error('Data Integrity Error: Scraped format statistics are empty or invalid.');
      }

      console.log('✅ Successfully extracted, normalized, and validated live statistics from Cricbuzz.');

      return {
        success: true,
        player: 'Virat Kohli',
        profile_url: url,
        scraped_at: new Date().toISOString(),
        stats: normalizedFormats
      };

    } catch (err) {
      lastError = err;
      console.warn(`⚠️ Attempt ${attempt}/${maxRetries} failed: ${err.message}`);

      if (attempt < maxRetries) {
        const backoffMs = attempt * 2000;
        console.log(`⏳ Waiting ${backoffMs / 1000}s before retrying...`);
        await sleep(backoffMs);
      }
    }
  }

  console.error('❌ All Cricbuzz scrape attempts failed.', lastError?.message);
  return {
    success: false,
    player: 'Virat Kohli',
    profile_url: url,
    scraped_at: new Date().toISOString(),
    error: lastError?.message || 'Unknown network error',
    stats: null
  };
}

/**
 * Maps batting row labels to formatStats object properties
 */
function mapBattingRow(label, values, formatStats) {
  const formats = ['test', 'odi', 't20i', 'ipl'];

  let key = null;
  if (label === 'matches') key = 'matches';
  else if (label === 'innings') key = 'innings';
  else if (label === 'runs') key = 'runs';
  else if (label === 'balls') key = 'ballsFaced';
  else if (label === 'highest') key = 'highestScore';
  else if (label === 'average') key = 'average';
  else if (label === 'sr') key = 'strikeRate';
  else if (label === 'not out') key = 'notOuts';
  else if (label === 'fours') key = 'fours';
  else if (label === 'sixes') key = 'sixes';
  else if (label === 'ducks') key = 'ducks';
  else if (label === '50s') key = 'halfCenturies';
  else if (label === '100s') key = 'centuries';
  else if (label === '200s') key = 'doubleCenturies';

  if (!key) return;

  formats.forEach((fmt, idx) => {
    if (values[idx] !== undefined) {
      formatStats[fmt][key] = values[idx];
    }
  });
}

// Quick CLI test runner
if (process.argv[1].endsWith('scraper.js')) {
  scrapeKohliStats()
    .then(res => console.log('Normalized Result:', JSON.stringify(res, null, 2)))
    .catch(err => console.error('Fatal error:', err));
}

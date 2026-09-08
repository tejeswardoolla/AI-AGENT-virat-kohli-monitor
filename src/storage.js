import fs from 'fs/promises';
import path from 'path';

const DEFAULT_DATA_PATH = path.resolve('data/virat_kohli_stats.json');

/**
 * Reads historical statistics baseline from JSON file.
 * @param {string} filePath Optional custom file path
 * @returns {Promise<Object|null>} Historical data object or null if baseline empty/missing
 */
export async function readHistoricalStats(filePath = DEFAULT_DATA_PATH) {
  try {
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    if (!fileExists) {
      console.log(`ℹ️ Storage baseline file not found at ${filePath}. Will initialize on save.`);
      return null;
    }

    const rawData = await fs.readFile(filePath, 'utf-8');
    if (!rawData || rawData.trim() === '') {
      return null;
    }

    const data = JSON.parse(rawData);

    // If last_updated is null or missing stats, treat as uninitialized baseline
    if (!data.last_updated || !data.stats) {
      return null;
    }

    return data;
  } catch (err) {
    console.warn(`⚠️ Warning: Failed to read historical storage file (${err.message}). Treating as first run.`);
    return null;
  }
}

/**
 * Saves updated statistics to historical JSON storage.
 * @param {Object} scrapedResult Scraped result object containing .stats
 * @param {string} filePath Optional custom file path
 */
export async function saveHistoricalStats(scrapedResult, filePath = DEFAULT_DATA_PATH) {
  try {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    const storagePayload = {
      player: scrapedResult.player || 'Virat Kohli',
      profile_url: scrapedResult.profile_url || 'https://www.cricbuzz.com/profiles/1413/virat-kohli',
      last_updated: scrapedResult.scraped_at || new Date().toISOString(),
      stats: scrapedResult.stats
    };

    await fs.writeFile(filePath, JSON.stringify(storagePayload, null, 2), 'utf-8');
    console.log(`💾 Historical statistics updated successfully at: ${filePath}`);
    return storagePayload;
  } catch (err) {
    console.error(`❌ Error saving historical stats to ${filePath}:`, err);
    throw err;
  }
}

// CLI unit test runner
if (process.argv[1].endsWith('storage.js')) {
  (async () => {
    console.log('🧪 Testing Storage Module...');
    const current = await readHistoricalStats();
    console.log('Current Stored Stats:', current ? 'Found' : 'Uninitialized/Null');
  })();
}

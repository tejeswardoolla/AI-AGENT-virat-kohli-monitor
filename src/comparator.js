/**
 * Statistics Comparison Engine, Milestone Detector & Duplicate Prevention for Virat Kohli Monitoring Agent.
 * Compares freshly scraped statistics against historical stored data.
 */

const CUMULATIVE_NUMERIC_FIELDS = [
  'matches',
  'innings',
  'runs',
  'ballsFaced',
  'notOuts',
  'fours',
  'sixes',
  'ducks',
  'halfCenturies',
  'centuries',
  'doubleCenturies'
];

const FLOAT_FIELDS = ['average', 'strikeRate'];

/**
 * Checks if a value crossed a threshold milestone between oldVal and newVal.
 * @param {number} oldVal 
 * @param {number} newVal 
 * @param {number} step 
 * @returns {number|null} The milestone reached or null
 */
function checkThresholdCrossed(oldVal, newVal, step) {
  if (!oldVal || !newVal || newVal <= oldVal) return null;
  const oldMilestone = Math.floor(oldVal / step) * step;
  const newMilestone = Math.floor(newVal / step) * step;
  if (newMilestone > oldMilestone && newMilestone <= newVal) {
    return newMilestone;
  }
  return null;
}

/**
 * Detects major milestones achieved between historical and current statistics.
 * @param {Object} currentStats 
 * @param {Object} historicalStats 
 * @returns {Array<Object>} List of milestone objects
 */
export function detectMilestones(currentStats, historicalStats) {
  const milestones = [];
  const formats = ['test', 'odi', 't20i', 'ipl'];

  formats.forEach((fmt) => {
    const cur = currentStats[fmt] || {};
    const hist = historicalStats[fmt] || {};
    const fmtLabel = fmt.toUpperCase();

    // 1. Century Milestones (Every 100)
    if (cur.centuries > (hist.centuries || 0)) {
      milestones.push({
        type: 'CENTURY',
        format: fmt,
        title: `🏆 New Century in ${fmtLabel}!`,
        description: `Virat Kohli scored century #${cur.centuries} in ${fmtLabel} cricket!`
      });
    }

    // 2. Double Century Milestones
    if (cur.doubleCenturies > (hist.doubleCenturies || 0)) {
      milestones.push({
        type: 'DOUBLE_CENTURY',
        format: fmt,
        title: `👑 Double Century Milestone in ${fmtLabel}!`,
        description: `Virat Kohli reached double century #${cur.doubleCenturies} in ${fmtLabel} cricket!`
      });
    }

    // 3. Half-Century Milestones
    if (cur.halfCenturies > (hist.halfCenturies || 0)) {
      if (cur.halfCenturies % 10 === 0 || (hist.halfCenturies < 50 && cur.halfCenturies >= 50)) {
        milestones.push({
          type: 'HALF_CENTURY_MILESTONE',
          format: fmt,
          title: `💥 ${cur.halfCenturies}th Half-Century in ${fmtLabel}`,
          description: `Virat Kohli registered his ${cur.halfCenturies}th 50+ score in ${fmtLabel} cricket!`
        });
      }
    }

    // 4. Run Threshold Milestones (1,000 run increments, or 500 for T20I)
    const runStep = fmt === 't20i' ? 500 : 1000;
    const runMilestone = checkThresholdCrossed(hist.runs, cur.runs, runStep);
    if (runMilestone) {
      milestones.push({
        type: 'RUN_MILESTONE',
        format: fmt,
        title: `🚀 Passed ${runMilestone.toLocaleString()} ${fmtLabel} Runs!`,
        description: `Virat Kohli crossed the legendary ${runMilestone.toLocaleString()} run barrier in ${fmtLabel} format!`
      });
    }

    // 5. Match Milestones (50 match increments)
    const matchMilestone = checkThresholdCrossed(hist.matches, cur.matches, 50);
    if (matchMilestone) {
      milestones.push({
        type: 'MATCH_MILESTONE',
        format: fmt,
        title: `🏟️ Played ${matchMilestone} ${fmtLabel} Matches`,
        description: `Virat Kohli completed ${matchMilestone} appearance matches in ${fmtLabel} cricket!`
      });
    }

    // 6. Boundary Milestones (500 Fours or 100 Sixes)
    const foursMilestone = checkThresholdCrossed(hist.fours, cur.fours, 500);
    if (foursMilestone) {
      milestones.push({
        type: 'BOUNDARY_MILESTONE',
        format: fmt,
        title: `⚡ ${foursMilestone.toLocaleString()} Fours in ${fmtLabel}`,
        description: `Virat Kohli crossed ${foursMilestone.toLocaleString()} career boundaries (4s) in ${fmtLabel}!`
      });
    }

    const sixesMilestone = checkThresholdCrossed(hist.sixes, cur.sixes, 100);
    if (sixesMilestone) {
      milestones.push({
        type: 'BOUNDARY_MILESTONE',
        format: fmt,
        title: `🔥 ${sixesMilestone} Sixes in ${fmtLabel}`,
        description: `Virat Kohli smashed his ${sixesMilestone}th six in ${fmtLabel} cricket!`
      });
    }
  });

  // 7. Overall International Total Runs Check (Test + ODI + T20I)
  const calcIntlRuns = (obj) => ((obj?.test?.runs || 0) + (obj?.odi?.runs || 0) + (obj?.t20i?.runs || 0));
  const oldIntl = calcIntlRuns(historicalStats);
  const newIntl = calcIntlRuns(currentStats);

  const intlMilestone = checkThresholdCrossed(oldIntl, newIntl, 1000);
  if (intlMilestone) {
    milestones.push({
      type: 'INTERNATIONAL_RUN_MILESTONE',
      format: 'international',
      title: `🌟 International Landmark: ${intlMilestone.toLocaleString()} Combined International Runs!`,
      description: `Virat Kohli crossed ${intlMilestone.toLocaleString()} combined runs across Test, ODI, and T20I international cricket!`
    });
  }

  return milestones;
}

/**
 * Compares live scraped stats against historical baseline stats with duplicate prevention & sanity guards.
 * @param {Object} currentData Live scraped object containing `.stats`
 * @param {Object|null} historicalData Saved baseline object from storage
 * @returns {Object} Structured comparison report
 */
export function compareStats(currentData, historicalData) {
  const formats = ['test', 'odi', 't20i', 'ipl'];
  
  // First run scenario (no prior baseline)
  if (!historicalData || !historicalData.stats || !historicalData.last_updated) {
    return {
      isFirstRun: true,
      hasChanges: true,
      formatsChanged: formats,
      formatChanges: {},
      summaryText: 'Initial baseline snapshot established across all formats.',
      milestones: [],
      warnings: []
    };
  }

  const currentStats = currentData.stats || {};
  const historicalStats = historicalData.stats || {};
  const warnings = [];

  // Duplicate Check: Fast JSON string comparison for exact zero-change match
  if (JSON.stringify(currentStats) === JSON.stringify(historicalStats)) {
    return {
      isFirstRun: false,
      hasChanges: false,
      formatsChanged: [],
      formatChanges: {},
      summaryText: 'No statistic changes detected (Duplicate Data Run).',
      milestones: [],
      warnings: []
    };
  }

  let hasChanges = false;
  const formatsChanged = [];
  const formatChanges = {};

  formats.forEach((fmt) => {
    const cur = currentStats[fmt] || {};
    const hist = historicalStats[fmt] || {};

    const changesInFormat = {};

    // Check cumulative integer metric deltas with negative delta guards
    CUMULATIVE_NUMERIC_FIELDS.forEach((field) => {
      const curVal = cur[field] ?? null;
      const histVal = hist[field] ?? null;

      if (curVal !== null && histVal !== null && curVal !== histVal) {
        const delta = curVal - histVal;

        // Negative Delta Sanity Guard: Flag anomalous drops in cumulative stats
        if (delta < 0) {
          warnings.push(`[ANOMALY] ${fmt.toUpperCase()} ${field} decreased from ${histVal} to ${curVal} (delta: ${delta}).`);
        }

        changesInFormat[field] = {
          old: histVal,
          new: curVal,
          delta: delta
        };
      }
    });

    // Check float metrics (average, strikeRate)
    FLOAT_FIELDS.forEach((field) => {
      const curVal = cur[field] ?? null;
      const histVal = hist[field] ?? null;

      if (curVal !== null && histVal !== null && Math.abs(curVal - histVal) >= 0.01) {
        changesInFormat[field] = {
          old: histVal,
          new: curVal,
          delta: Number((curVal - histVal).toFixed(2))
        };
      }
    });

    // Highest score check
    if (cur.highestScore && hist.highestScore && cur.highestScore !== hist.highestScore) {
      changesInFormat.highestScore = {
        old: hist.highestScore,
        new: cur.highestScore,
        delta: null
      };
    }

    if (Object.keys(changesInFormat).length > 0) {
      hasChanges = true;
      formatsChanged.push(fmt);
      formatChanges[fmt] = changesInFormat;
    }
  });

  const milestones = detectMilestones(currentStats, historicalStats);

  return {
    isFirstRun: false,
    hasChanges,
    formatsChanged,
    formatChanges,
    summaryText: hasChanges
      ? `Updated statistics detected in format(s): ${formatsChanged.map(f => f.toUpperCase()).join(', ')}.`
      : 'No statistic changes detected since last check.',
    milestones,
    warnings
  };
}

// CLI unit test runner
if (process.argv[1].endsWith('comparator.js')) {
  const dummyHist = {
    last_updated: '2026-09-06T10:00:00.000Z',
    stats: {
      odi: { matches: 314, runs: 14941, centuries: 54, average: 58.59, fours: 1389 }
    }
  };

  // Test 1: Identical Stats Run (Duplicate)
  console.log('🧪 Duplicate Test:\n', JSON.stringify(compareStats({ stats: dummyHist.stats }, dummyHist), null, 2));
}

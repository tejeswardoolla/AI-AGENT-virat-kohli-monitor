import { config } from './config.js';
import { readHistoricalStats, saveHistoricalStats } from './storage.js';
import { scrapeKohliStats } from './scraper.js';
import { compareStats } from './comparator.js';
import { generateSummary } from './ai_summary.js';
import { sendEmailNotification } from './email.js';

async function runPipeline() {
  console.log('---------------------------------------------------------');
  console.log('🏏 VIRAT KOHLI DAILY STATISTICS MONITORING AGENT');
  console.log(`⏰ Execution Started: ${new Date().toISOString()}`);
  console.log('---------------------------------------------------------');

  // Step 1: Read historical baseline stats
  console.log('\n📂 Step 1/5: Reading historical statistics baseline...');
  const historicalBaseline = await readHistoricalStats();

  // Step 2: Scrape live stats from Cricbuzz
  console.log('\n📡 Step 2/5: Scraping live stats from Cricbuzz...');
  const scrapeResult = await scrapeKohliStats(3);

  if (!scrapeResult || !scrapeResult.success) {
    console.error('❌ Data collection failed after retries. Aborting pipeline run.');
    process.exit(1);
  }

  // Step 3: Compare live stats against baseline
  console.log('\n📊 Step 3/5: Running statistics comparison & milestone detector...');
  const report = compareStats(scrapeResult, historicalBaseline);

  console.log(`\n📋 Comparison Result: ${report.summaryText}`);
  if (report.warnings && report.warnings.length > 0) {
    report.warnings.forEach(w => console.warn(`⚠️ ${w}`));
  }

  // Step 4: Generate Executive Summary
  console.log('\n🤖 Step 4/5: Synthesizing summary and commentary...');
  const summary = await generateSummary(report, scrapeResult);
  console.log(`\nHeadline: ${summary.headline}`);

  // Step 5: Save updated stats and send Email Notification
  console.log('\n💾 Step 5/5: Updating storage baseline & dispatching email...');

  // Save new baseline if there are changes or on first run
  if (report.hasChanges || report.isFirstRun) {
    await saveHistoricalStats(scrapeResult);
  } else {
    console.log('ℹ️ Baseline unchanged. Storage update skipped.');
  }

  // Determine whether to send email notification
  const shouldSendEmail = report.hasChanges || report.isFirstRun || config.forceEmailOnNoChange;

  if (shouldSendEmail) {
    const isPlaceholderUser = !config.email.user || config.email.user.includes('your_email');
    const isPlaceholderPass = !config.email.pass || config.email.pass.includes('your_16_char');

    if (isPlaceholderUser || isPlaceholderPass) {
      console.log('⚠️ Gmail credentials in .env are using placeholders (GMAIL_USER / GMAIL_PASS). Skipping email dispatch.');
    } else {
      try {
        await sendEmailNotification(report, summary, scrapeResult);
      } catch (err) {
        console.error(`⚠️ Email dispatch failed: ${err.message}`);
      }
    }
  } else {
    console.log('ℹ️ No statistical changes detected today. Email notification skipped (FORCE_EMAIL=false).');
  }

  console.log('\n---------------------------------------------------------');
  console.log('✅ MONITORING PIPELINE COMPLETED SUCCESSFULLY!');
  console.log('---------------------------------------------------------');
}

runPipeline().catch((err) => {
  console.error('\n❌ Unhandled Pipeline Execution Error:', err);
  process.exit(1);
});

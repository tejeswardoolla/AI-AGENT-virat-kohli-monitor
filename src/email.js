import nodemailer from 'nodemailer';
import { config } from './config.js';

/**
 * Creates nodemailer SMTP transport instance
 */
function createTransporter() {
  const user = config.email.user;
  const pass = config.email.pass;

  if (!user || !pass) {
    throw new Error('Email credentials missing. Please set GMAIL_USER and GMAIL_PASS in your .env file.');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
}

/**
 * Builds a modern, responsive HTML email template for Virat Kohli Statistics.
 */

export function buildHtmlEmailTemplate(report, summary, latestData) {
  const stats = latestData.stats || {};

  const milestonesHtml = (report.milestones && report.milestones.length > 0)
    ? `
      <div style="background: #FFFBEB; border-left: 4px solid #F59E0B; padding: 16px; margin: 20px 0; border-radius: 6px;">
        <h3 style="margin: 0 0 10px 0; color: #B45309; font-size: 16px;">🏆 New Milestones Reached!</h3>
        ${report.milestones.map(m => `
          <div style="margin-bottom: 8px;">
            <strong style="color: #92400E;">${m.title}:</strong> <span style="color: #78350F;">${m.description}</span>
          </div>
        `).join('')}
      </div>
    ` : '';

  const formatCard = (fmtName, fmtData) => {
    if (!fmtData) return '';
    return `
      <td style="width: 50%; padding: 8px; vertical-align: top;">
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px;">
          <h4 style="margin: 0 0 10px 0; color: #1E293B; font-size: 15px; border-bottom: 2px solid #3B82F6; padding-bottom: 4px; display: inline-block;">
            ${fmtName}
          </h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
            <tr><td style="padding: 2px 0;">Matches:</td><td style="text-align: right; font-weight: 600;">${fmtData.matches ?? 'N/A'}</td></tr>
            <tr><td style="padding: 2px 0;">Innings:</td><td style="text-align: right; font-weight: 600;">${fmtData.innings ?? 'N/A'}</td></tr>
            <tr><td style="padding: 2px 0;">Runs:</td><td style="text-align: right; font-weight: 600; color: #0284C7;">${fmtData.runs ? fmtData.runs.toLocaleString() : 'N/A'}</td></tr>
            <tr><td style="padding: 2px 0;">Highest:</td><td style="text-align: right; font-weight: 600;">${fmtData.highestScore ?? 'N/A'}</td></tr>
            <tr><td style="padding: 2px 0;">Average:</td><td style="text-align: right; font-weight: 600; color: #16A34A;">${fmtData.average ?? 'N/A'}</td></tr>
            <tr><td style="padding: 2px 0;">100s / 50s:</td><td style="text-align: right; font-weight: 600; color: #D97706;">${fmtData.centuries ?? 0} / ${fmtData.halfCenturies ?? 0}</td></tr>
          </table>
        </div>
      </td>
    `;
  };

  const highlightsHtml = summary.highlights.map(h => {
    const formatted = h.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return `<li style="margin-bottom: 8px; line-height: 1.5; color: #334155;">${formatted}</li>`;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Virat Kohli Daily Statistics Monitor</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F1F5F9; margin: 0; padding: 20px;">
      <div style="max-width: 650px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
        
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%); color: #FFFFFF; padding: 28px 24px; text-align: center;">
          <h1 style="margin: 0 0 6px 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">🏏 Virat Kohli Statistics Monitor</h1>
          <p style="margin: 0; font-size: 13px; color: #93C5FD;">Daily Career Tracking & Milestone Intelligence System</p>
        </div>

        <!-- Content Area -->
        <div style="padding: 24px;">
          
          <!-- Headline Status Badge -->
          <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 6px 0; color: #1E40AF; font-size: 17px;">${summary.headline}</h2>
            <p style="margin: 0; color: #3B82F6; font-size: 14px; line-height: 1.4;">${summary.summaryParagraph}</p>
          </div>

          <!-- Milestones Section -->
          ${milestonesHtml}

          <!-- Highlights List -->
          <div style="margin-bottom: 24px;">
            <h3 style="margin: 0 0 12px 0; color: #0F172A; font-size: 16px;">📌 Key Highlights</h3>
            <ul style="margin: 0; padding-left: 20px;">
              ${highlightsHtml}
            </ul>
          </div>

          <!-- Stats Grid -->
          <h3 style="margin: 0 0 12px 0; color: #0F172A; font-size: 16px;">📊 Career Statistics Overview</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              ${formatCard('Test Format', stats.test)}
              ${formatCard('ODI Format', stats.odi)}
            </tr>
            <tr>
              ${formatCard('T20I Format', stats.t20i)}
              ${formatCard('IPL Format', stats.ipl)}
            </tr>
          </table>

          <!-- Footer Action Button -->
          <div style="text-align: center; margin: 24px 0 12px 0;">
            <a href="${latestData.profile_url}" target="_blank" style="background: #2563EB; color: #FFFFFF; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
              View Live Profile on Cricbuzz ➔
            </a>
          </div>

        </div>

        <!-- Footer -->
        <div style="background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 16px; text-align: center; font-size: 12px; color: #64748B;">
          <p style="margin: 0 0 4px 0;">Generated automatically by <strong>Virat Kohli Daily Stats Monitoring Agent</strong></p>
          <p style="margin: 0;">Execution Time: ${new Date().toUTCString()}</p>
        </div>

      </div>
    </body>
    </html>
  `;
}

/**
 * Dispatches the statistics monitoring email report.
 * @param {Object} report Comparison report
 * @param {Object} summary Generated summary object
 * @param {Object} latestData Scraped statistics object
 */
export async function sendEmailNotification(report, summary, latestData) {
  const recipient = config.email.to || config.email.user;
  console.log(`📧 Preparing email notification for: ${recipient}`);

  const transporter = createTransporter();
  const htmlContent = buildHtmlEmailTemplate(report, summary, latestData);

  const subject = report.hasChanges
    ? `🏏 [STAT UPDATE] Virat Kohli — ${summary.headline}`
    : `🏏 [DAILY REPORT] Virat Kohli Statistics Summary`;

  const mailOptions = {
    from: `"Virat Kohli Monitor" <${config.email.user}>`,
    to: recipient,
    subject: subject,
    html: htmlContent
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`✅ Email sent successfully! Message ID: ${info.messageId}`);
  return info;
}

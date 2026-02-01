/**
 * Email service for sending research results as backup.
 *
 * Uses Resend for reliable email delivery when research completes
 * or when connection is lost and results need to be delivered.
 */

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface ResearchEmailData {
  sessionId: string;
  query: string;
  template: string;
  findingsCount: number;
  sourcesCount: number;
  perspectivesCount: number;
  executionTime: number;
  totalCost: number;
  reportMarkdown?: string;
  appUrl?: string;
}

export async function sendResearchCompletedEmail(
  to: string,
  data: ResearchEmailData
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    return { success: false, error: 'Email service not configured' };
  }

  const appUrl = data.appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const sessionUrl = `${appUrl}/actor/results/${data.sessionId}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
    .stat { background: white; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb; }
    .stat-value { font-size: 28px; font-weight: bold; color: #667eea; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
    .query-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; }
    .report { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; font-family: monospace; font-size: 13px; white-space: pre-wrap; max-height: 400px; overflow-y: auto; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Research Complete</h1>
    </div>
    <div class="content">
      <div class="query-box">
        <strong>Research Query:</strong><br>
        ${escapeHtml(data.query)}
      </div>

      <div class="stats">
        <div class="stat">
          <div class="stat-value">${data.findingsCount}</div>
          <div class="stat-label">Findings</div>
        </div>
        <div class="stat">
          <div class="stat-value">${data.sourcesCount}</div>
          <div class="stat-label">Sources</div>
        </div>
        <div class="stat">
          <div class="stat-value">${data.perspectivesCount}</div>
          <div class="stat-label">Perspectives</div>
        </div>
      </div>

      <p>
        <strong>Template:</strong> ${data.template}<br>
        <strong>Execution Time:</strong> ${data.executionTime.toFixed(1)} seconds<br>
        <strong>Estimated Cost:</strong> $${data.totalCost.toFixed(4)}
      </p>

      <p style="text-align: center; margin: 30px 0;">
        <a href="${sessionUrl}" class="button">View Full Results</a>
      </p>

      ${data.reportMarkdown ? `
      <h3>Report Preview</h3>
      <div class="report">${escapeHtml(data.reportMarkdown.slice(0, 2000))}${data.reportMarkdown.length > 2000 ? '\n\n... (truncated)' : ''}</div>
      ` : ''}

      <div class="footer">
        <p>This email was sent because you requested research via Deep Research Actor.</p>
        <p>Session ID: ${data.sessionId}</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
Research Complete

Query: ${data.query}

Results Summary:
- ${data.findingsCount} findings extracted
- ${data.sourcesCount} sources cited
- ${data.perspectivesCount} expert perspectives

Template: ${data.template}
Execution Time: ${data.executionTime.toFixed(1)} seconds
Estimated Cost: $${data.totalCost.toFixed(4)}

View full results at: ${sessionUrl}

${data.reportMarkdown ? `\nReport Preview:\n${data.reportMarkdown.slice(0, 1000)}${data.reportMarkdown.length > 1000 ? '\n\n... (truncated)' : ''}` : ''}

---
Session ID: ${data.sessionId}
  `;

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Research <research@resend.dev>',
      to,
      subject: `Research Complete: ${data.query.slice(0, 50)}${data.query.length > 50 ? '...' : ''}`,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error('Failed to send email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Email service error:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

export async function sendResearchFailedEmail(
  to: string,
  data: {
    sessionId: string;
    query: string;
    errorMessage: string;
    partialResults?: {
      findingsCount: number;
      sourcesCount: number;
    };
    appUrl?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    return { success: false, error: 'Email service not configured' };
  }

  const appUrl = data.appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const sessionUrl = `${appUrl}/actor/results/${data.sessionId}`;

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Research <research@resend.dev>',
      to,
      subject: `Research Failed: ${data.query.slice(0, 50)}${data.query.length > 50 ? '...' : ''}`,
      html: `
        <h2>Research Failed</h2>
        <p><strong>Query:</strong> ${escapeHtml(data.query)}</p>
        <p><strong>Error:</strong> ${escapeHtml(data.errorMessage)}</p>
        ${data.partialResults ? `
        <p><strong>Partial Results:</strong></p>
        <ul>
          <li>${data.partialResults.findingsCount} findings extracted before failure</li>
          <li>${data.partialResults.sourcesCount} sources collected</li>
        </ul>
        <p><a href="${sessionUrl}">View partial results</a></p>
        ` : ''}
        <p style="color: #666; font-size: 12px;">Session ID: ${data.sessionId}</p>
      `,
      text: `Research Failed\n\nQuery: ${data.query}\nError: ${data.errorMessage}\n\nSession ID: ${data.sessionId}`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

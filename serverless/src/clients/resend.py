"""Resend client for email delivery."""

import logging
from typing import Optional, Dict, Any

import httpx

logger = logging.getLogger(__name__)


class ResendClient:
    """Email delivery client using Resend API."""

    def __init__(
        self,
        api_key: str,
        from_email: str = "Deep Research <research@resend.dev>",
    ):
        self.api_key = api_key
        self.from_email = from_email
        self.base_url = "https://api.resend.com"

    def is_available(self) -> bool:
        """Check if API key is configured."""
        return bool(self.api_key)

    async def send_report(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        attachments: Optional[list] = None,
    ) -> Dict[str, Any]:
        """
        Send research report via email.

        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML body content
            text_content: Plain text fallback (optional)
            attachments: List of attachment dicts with 'filename' and 'content' keys

        Returns:
            Dict with 'success', 'id', 'error' keys
        """
        if not self.is_available():
            return {"success": False, "error": "Resend API key not configured"}

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "from": self.from_email,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }

        if text_content:
            payload["text"] = text_content

        if attachments:
            payload["attachments"] = attachments

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/emails",
                    headers=headers,
                    json=payload
                )

                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"Email sent successfully: {data.get('id')}")
                    return {
                        "success": True,
                        "id": data.get("id"),
                        "error": None
                    }
                else:
                    error_msg = response.text
                    logger.warning(f"Failed to send email: {error_msg}")
                    return {
                        "success": False,
                        "id": None,
                        "error": error_msg
                    }

        except httpx.TimeoutException:
            logger.warning("Email send timed out")
            return {"success": False, "id": None, "error": "Request timed out"}
        except Exception as e:
            logger.warning(f"Email send failed: {str(e)}")
            return {"success": False, "id": None, "error": str(e)}

    def build_report_email(
        self,
        query: str,
        template: str,
        executive_summary: Dict[str, Any],
        report_html: Optional[str] = None,
        report_markdown: Optional[str] = None,
        findings_with_sources: Optional[list] = None,
        predictions: Optional[list] = None,
    ) -> Dict[str, str]:
        """
        Build email content from research results.

        Args:
            query: Original research query
            template: Template used
            executive_summary: Executive summary dict
            report_html: Full HTML report (optional)
            report_markdown: Full markdown report (optional)
            findings_with_sources: List of findings with supporting_sources for URL display
            predictions: List of structured predictions with rationale

        Returns:
            Dict with 'subject', 'html', 'text' keys
        """
        # Build subject
        query_short = query[:50] + "..." if len(query) > 50 else query
        subject = f"Research Complete: {query_short}"

        # Build HTML email
        findings_count = executive_summary.get("findings_count", 0)
        high_conf = executive_summary.get("high_confidence_findings", 0)
        sources_count = executive_summary.get("sources_count", 0)
        cost = executive_summary.get("total_cost_usd", 0)
        exec_time = executive_summary.get("execution_time_seconds", 0)

        top_findings = executive_summary.get("top_findings", [])
        recommendations = executive_summary.get("expert_recommendations", [])
        warnings = executive_summary.get("expert_warnings", [])
        insights = executive_summary.get("key_insights", [])

        # Build findings HTML with source URLs
        findings_html = ""
        if findings_with_sources:
            # Use full findings with sources
            for finding in findings_with_sources[:5]:
                summary = finding.get("summary") or finding.get("content", "")[:150]
                sources = finding.get("supporting_sources", [])
                date_info = ""
                if finding.get("date_referenced"):
                    date_info = f" <em>({finding['date_referenced']})</em>"
                elif finding.get("date_range"):
                    date_info = f" <em>({finding['date_range']})</em>"

                source_links = ""
                if sources:
                    links = []
                    for src in sources[:2]:
                        url = src.get("url", "")
                        title = src.get("title", src.get("domain", "Source"))[:30]
                        if url:
                            links.append(f'<a href="{url}" style="color:#3b82f6;font-size:11px;">{title}</a>')
                    if links:
                        source_links = f'<br><span style="font-size:11px;color:#6b7280;">Sources: {" | ".join(links)}</span>'

                findings_html += f"<li>{summary}{date_info}{source_links}</li>\n"
        else:
            # Fallback to simple strings
            for finding in top_findings[:5]:
                findings_html += f"<li>{finding}</li>\n"

        # Build predictions HTML (replaces recommendations)
        predictions_html = ""
        if predictions:
            for pred in predictions[:5]:
                if isinstance(pred, dict):
                    pred_text = pred.get("prediction", "")
                    rationale = pred.get("rationale", "")
                    confidence = pred.get("confidence", "medium")
                    timeline = pred.get("timeline", "")
                    pred_sources = pred.get("supporting_sources", [])

                    # Handle confidence as float or string
                    if isinstance(confidence, (int, float)):
                        conf_str = "high" if confidence >= 0.8 else "medium" if confidence >= 0.5 else "low"
                    else:
                        conf_str = str(confidence) if confidence else "medium"

                    details = []
                    if rationale:
                        details.append(f"<em>Why:</em> {rationale[:150]}")
                    if timeline:
                        details.append(f"<em>Timeline:</em> {timeline}")
                    details.append(f"<em>Confidence:</em> {conf_str.title()}")
                    if pred_sources:
                        details.append(f"<em>Based on:</em> {', '.join(str(s)[:30] for s in pred_sources[:2])}")

                    details_html = '<br><span style="font-size:12px;color:#6b7280;margin-left:16px;">' + ' | '.join(details) + '</span>' if details else ""
                    predictions_html += f"<li><strong>{pred_text}</strong>{details_html}</li>\n"
                else:
                    predictions_html += f"<li>{pred}</li>\n"
        else:
            # Fallback to recommendations
            for rec in recommendations[:5]:
                predictions_html += f"<li>{rec}</li>\n"

        # Build warnings HTML
        warnings_html = ""
        for warn in warnings[:3]:
            warnings_html += f"<li style='color: #dc2626;'>{warn}</li>\n"

        # Build insights HTML
        insights_html = ""
        for insight in insights[:5]:
            insights_html += f"<li>{insight}</li>\n"

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 800px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 30px; border-radius: 12px; margin-bottom: 24px; }}
        .header h1 {{ margin: 0 0 8px 0; font-size: 24px; }}
        .header p {{ margin: 0; opacity: 0.9; }}
        .metrics {{ display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }}
        .metric {{ background: #f3f4f6; padding: 16px 20px; border-radius: 8px; flex: 1; min-width: 120px; }}
        .metric-value {{ font-size: 28px; font-weight: bold; color: #3b82f6; }}
        .metric-label {{ font-size: 12px; color: #6b7280; text-transform: uppercase; }}
        .section {{ background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 16px; }}
        .section h2 {{ margin: 0 0 12px 0; font-size: 18px; color: #374151; }}
        .section ul {{ margin: 0; padding-left: 20px; }}
        .section li {{ margin-bottom: 8px; }}
        .warning-section {{ border-left: 4px solid #dc2626; }}
        .footer {{ text-align: center; color: #9ca3af; font-size: 12px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Research Complete</h1>
        <p>{query}</p>
    </div>

    <div class="metrics">
        <div class="metric">
            <div class="metric-value">{findings_count}</div>
            <div class="metric-label">Findings</div>
        </div>
        <div class="metric">
            <div class="metric-value">{high_conf}</div>
            <div class="metric-label">High Confidence</div>
        </div>
        <div class="metric">
            <div class="metric-value">{sources_count}</div>
            <div class="metric-label">Sources</div>
        </div>
        <div class="metric">
            <div class="metric-value">{exec_time:.0f}s</div>
            <div class="metric-label">Time</div>
        </div>
    </div>

    {"<div class='section'><h2>Top Findings</h2><ul>" + findings_html + "</ul></div>" if findings_html else ""}

    {"<div class='section'><h2>Key Insights</h2><ul>" + insights_html + "</ul></div>" if insights_html else ""}

    {"<div class='section'><h2>Predictions</h2><ul>" + predictions_html + "</ul></div>" if predictions_html else ""}

    {"<div class='section warning-section'><h2>Warnings</h2><ul>" + warnings_html + "</ul></div>" if warnings_html else ""}

    <div class="footer">
        <p>Generated by Deep Research Actor | Template: {template} | Cost: ${cost:.4f}</p>
        <p>Full report attached as markdown and HTML files</p>
    </div>
</body>
</html>
"""

        # Build plain text predictions
        text_predictions = []
        if predictions:
            for pred in predictions[:5]:
                if isinstance(pred, dict):
                    pred_text = pred.get("prediction", "")
                    rationale = pred.get("rationale", "")
                    timeline = pred.get("timeline", "")
                    confidence = pred.get("confidence", "medium")
                    text_predictions.append(f"- {pred_text}")
                    if rationale:
                        text_predictions.append(f"  Why: {rationale[:100]}")
                    if timeline:
                        text_predictions.append(f"  Timeline: {timeline} | Confidence: {confidence}")
                else:
                    text_predictions.append(f"- {pred}")
        else:
            text_predictions = [f'- {r}' for r in recommendations[:5]]

        # Build plain text version
        text_content = f"""
Research Complete: {query}

METRICS
- Findings: {findings_count} ({high_conf} high confidence)
- Sources: {sources_count}
- Execution Time: {exec_time:.1f}s
- Cost: ${cost:.4f}

TOP FINDINGS
{chr(10).join(f'- {f}' for f in top_findings[:5])}

KEY INSIGHTS
{chr(10).join(f'- {i}' for i in insights[:5])}

PREDICTIONS
{chr(10).join(text_predictions)}

{"WARNINGS" + chr(10) + chr(10).join(f'- {w}' for w in warnings[:3]) if warnings else ""}

---
Generated by Deep Research Actor
Template: {template}
Full report attached as markdown and HTML files
"""

        return {
            "subject": subject,
            "html": html_content,
            "text": text_content
        }

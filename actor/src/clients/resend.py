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
        contradictions: Optional[list] = None,
        knowledge_gaps: Optional[list] = None,
        role_summaries: Optional[Dict[str, Any]] = None,
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
            contradictions: List of detected contradictions between findings
            knowledge_gaps: List of identified knowledge gaps
            role_summaries: Dict of role-specific summaries (cto, cfo, ceo)

        Returns:
            Dict with 'subject', 'html', 'text' keys
        """
        import html as html_mod

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
            for finding in findings_with_sources[:5]:
                summary = finding.get("summary") or finding.get("content", "")[:150]
                sources = finding.get("supporting_sources", [])
                conf = finding.get("confidence_score", 0.5)
                conf_label = "high" if conf >= 0.8 else "medium" if conf >= 0.6 else "low"
                conf_color = "#059669" if conf_label == "high" else "#d97706" if conf_label == "medium" else "#6b7280"

                date_info = ""
                if finding.get("date_referenced"):
                    date_info = f' <span style="color:#6b7280;font-size:12px;">({finding["date_referenced"]})</span>'
                elif finding.get("date_range"):
                    date_info = f' <span style="color:#6b7280;font-size:12px;">({finding["date_range"]})</span>'

                source_links = ""
                if sources:
                    links = []
                    for src in sources[:2]:
                        url = src.get("url", "")
                        title = src.get("title", src.get("domain", "Source"))[:30]
                        if url:
                            links.append(f'<a href="{url}" style="color:#3b82f6;text-decoration:none;font-size:11px;">{html_mod.escape(title)}</a>')
                    if links:
                        source_links = f'<div style="margin-top:4px;font-size:11px;color:#6b7280;">Sources: {" · ".join(links)}</div>'

                findings_html += f'''<div style="border-left:3px solid #64748b;padding:12px 16px;margin-bottom:12px;background:#f8fafc;border-radius:0 8px 8px 0;">
                    <div style="font-size:14px;color:#1e293b;">{html_mod.escape(summary)}{date_info}</div>
                    {source_links}
                </div>\n'''
        else:
            for finding in top_findings[:5]:
                findings_html += f'<div style="border-left:3px solid #3b82f6;padding:12px 16px;margin-bottom:12px;background:#f8fafc;border-radius:0 8px 8px 0;font-size:14px;color:#1e293b;">{html_mod.escape(str(finding))}</div>\n'

        # Build predictions HTML
        predictions_html = ""
        if predictions:
            for pred in predictions[:5]:
                if isinstance(pred, dict):
                    pred_text = pred.get("prediction", "")
                    rationale = pred.get("rationale", "")
                    confidence = pred.get("confidence", "medium")
                    timeline = pred.get("timeline", "")

                    if isinstance(confidence, (int, float)):
                        conf_str = "high" if confidence >= 0.8 else "medium" if confidence >= 0.5 else "low"
                    else:
                        conf_str = str(confidence) if confidence else "medium"

                    conf_color = "#059669" if conf_str == "high" else "#d97706" if conf_str == "medium" else "#6b7280"

                    rationale_html = f'<div style="margin-top:6px;color:#64748b;font-size:12px;font-style:italic;">{html_mod.escape(rationale[:120])}</div>' if rationale else ""
                    timeline_html = f'<div style="margin-top:6px;font-size:12px;color:#6b7280;">Timeline: {timeline}</div>' if timeline else ""

                    predictions_html += f'''<div style="padding:12px 16px;margin-bottom:12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
                        <div style="font-size:14px;color:#1e293b;font-weight:500;">{html_mod.escape(pred_text)}</div>
                        {rationale_html}
                        {timeline_html}
                    </div>\n'''
                else:
                    predictions_html += f'<div style="padding:12px 16px;margin-bottom:12px;background:#f0f9ff;border-radius:8px;border:1px solid #bae6fd;font-size:14px;color:#0c4a6e;">{html_mod.escape(str(pred))}</div>\n'
        else:
            for rec in recommendations[:5]:
                predictions_html += f'<div style="padding:12px 16px;margin-bottom:12px;background:#f0f9ff;border-radius:8px;border:1px solid #bae6fd;font-size:14px;color:#0c4a6e;">{html_mod.escape(str(rec))}</div>\n'

        # Build warnings HTML
        warnings_html = ""
        for warn in warnings[:3]:
            warnings_html += f'<div style="padding:10px 16px;margin-bottom:8px;background:#fef2f2;border-radius:8px;border:1px solid #fecaca;font-size:14px;color:#991b1b;">• {html_mod.escape(str(warn))}</div>\n'

        # Build insights HTML
        insights_html = ""
        for insight in insights[:5]:
            insights_html += f'<div style="padding:10px 16px;margin-bottom:8px;border-left:3px solid #64748b;background:#f8fafc;font-size:14px;color:#475569;border-radius:0 6px 6px 0;">{html_mod.escape(str(insight))}</div>\n'

        # Build contradictions HTML
        contradictions_html = ""
        if contradictions:
            contr_items = ""
            for c in contradictions[:3]:
                severity = c.get("severity", "medium")
                severity_color = "#dc2626" if severity == "high" else "#f59e0b" if severity == "medium" else "#6b7280"
                contr_items += f'''<div style="padding:12px 16px;margin-bottom:12px;background:#fffbeb;border-radius:8px;border:1px solid #fde68a;">
                    <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
                        <span style="background:{severity_color}15;color:{severity_color};padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;text-transform:uppercase;">{severity}</span>
                        <span style="color:#92400e;font-size:11px;text-transform:uppercase;">{html_mod.escape(c.get("contradiction_type", ""))}</span>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:8px;margin-bottom:8px;">
                        <div style="font-size:12px;color:#1e293b;padding:8px;background:#fff7ed;border-radius:4px;">{html_mod.escape(c.get("finding_a_summary", "")[:80])}</div>
                        <div style="color:#9ca3af;font-size:12px;font-weight:600;align-self:center;">VS</div>
                        <div style="font-size:12px;color:#1e293b;padding:8px;background:#fff7ed;border-radius:4px;">{html_mod.escape(c.get("finding_b_summary", "")[:80])}</div>
                    </div>
                    <div style="font-size:12px;color:#78716c;font-style:italic;">{html_mod.escape(c.get("resolution_hint", ""))}</div>
                </div>\n'''
            contradictions_html = f'''<div style="background:#ffffff;border:1px solid #fde68a;border-radius:12px;padding:20px;margin-bottom:20px;">
                <h2 style="margin:0 0 16px 0;font-size:16px;color:#92400e;display:flex;align-items:center;gap:8px;">
                    <span style="font-size:18px;">⚡</span> Contradictions Detected ({len(contradictions)})
                </h2>
                {contr_items}
            </div>'''

        # Build role summaries HTML
        role_summaries_html = ""
        if role_summaries:
            role_cards = ""
            role_colors = {
                "cto": ("#6366f1", "#eef2ff", "🔧"),
                "cfo": ("#059669", "#ecfdf5", "💰"),
                "ceo": ("#dc2626", "#fef2f2", "👔"),
            }
            for role, data in role_summaries.items():
                color, bg, icon = role_colors.get(role, ("#6b7280", "#f9fafb", "👤"))
                key_points = "".join([f'<div style="padding:4px 0;font-size:12px;color:#475569;border-bottom:1px solid #f1f5f9;">• {html_mod.escape(p)}</div>' for p in data.get("key_points", [])[:3]])
                actions = "".join([f'<div style="padding:4px 0;font-size:12px;color:#059669;">→ {html_mod.escape(a)}</div>' for a in data.get("action_items", [])[:2]])

                role_cards += f'''<div style="flex:1;min-width:200px;background:{bg};border:1px solid {color}33;border-radius:12px;padding:16px;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                        <span style="font-size:24px;">{icon}</span>
                        <div>
                            <div style="font-size:14px;font-weight:600;color:{color};">{html_mod.escape(data.get("role_title", role.upper()))}</div>
                            <div style="font-size:11px;color:#64748b;">{html_mod.escape(data.get("headline", "")[:50])}</div>
                        </div>
                    </div>
                    <div style="margin-bottom:8px;">
                        <div style="font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;margin-bottom:4px;">Key Points</div>
                        {key_points}
                    </div>
                    <div>
                        <div style="font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;margin-bottom:4px;">Actions</div>
                        {actions}
                    </div>
                </div>\n'''
            role_summaries_html = f'''<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:20px;">
                <h2 style="margin:0 0 16px 0;font-size:16px;color:#1e293b;display:flex;align-items:center;gap:8px;">
                    <span style="font-size:18px;">👥</span> Executive Views
                </h2>
                <div style="display:flex;gap:16px;flex-wrap:wrap;">
                    {role_cards}
                </div>
            </div>'''

        # Build section HTML blocks (avoiding backslash issues in f-strings)
        findings_section = ""
        if findings_html:
            findings_section = '<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:20px;"><h2 style="margin:0 0 16px 0;font-size:16px;color:#1e293b;">Top Findings</h2>' + findings_html + '</div>'

        insights_section = ""
        if insights_html:
            insights_section = '<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:20px;"><h2 style="margin:0 0 16px 0;font-size:16px;color:#1e293b;">Key Insights</h2>' + insights_html + '</div>'

        predictions_section = ""
        if predictions_html:
            predictions_section = '<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:20px;"><h2 style="margin:0 0 16px 0;font-size:16px;color:#1e293b;">Predictions</h2>' + predictions_html + '</div>'

        warnings_section_html = ""
        if warnings_html:
            warnings_section_html = '<div style="background:#ffffff;border:1px solid #fecaca;border-radius:12px;padding:20px;margin-bottom:20px;"><h2 style="margin:0 0 16px 0;font-size:16px;color:#991b1b;">Warnings</h2>' + warnings_html + '</div>'

        escaped_query = html_mod.escape(query)
        template_upper = template.upper()

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 700px; margin: 0 auto; padding: 24px; background: #f8fafc;">
    <!-- Hero Header -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; padding: 32px; border-radius: 16px; margin-bottom: 24px;">
        <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 700;">Research Complete</h1>
        <p style="margin: 0; font-size: 15px; color: #e2e8f0; line-height: 1.5;">{escaped_query}</p>
    </div>

    <!-- Metrics Grid -->
    <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px;">
        <div style="flex: 1; min-width: 100px; padding: 16px; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: #1e293b;">{findings_count}</div>
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em;">Findings</div>
        </div>
        <div style="flex: 1; min-width: 100px; padding: 16px; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: #1e293b;">{high_conf}</div>
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em;">High Confidence</div>
        </div>
        <div style="flex: 1; min-width: 100px; padding: 16px; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: #1e293b;">{sources_count}</div>
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em;">Sources</div>
        </div>
        <div style="flex: 1; min-width: 100px; padding: 16px; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: #1e293b;">{exec_time:.0f}s</div>
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em;">Time</div>
        </div>
    </div>

    <!-- Role Summaries (Executive Views) -->
    {role_summaries_html}

    <!-- Contradictions Alert -->
    {contradictions_html}

    <!-- Top Findings -->
    {findings_section}

    <!-- Key Insights -->
    {insights_section}

    <!-- Predictions -->
    {predictions_section}

    <!-- Warnings -->
    {warnings_section_html}

    <!-- Footer -->
    <div style="text-align: center; color: #64748b; font-size: 12px; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0;">Generated by <strong style="color: #3b82f6;">Deep Research Actor</strong></p>
        <p style="margin: 4px 0 0 0; color: #94a3b8;">Full interactive report attached</p>
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

        # Build plain text role summaries
        text_roles = ""
        if role_summaries:
            role_lines = []
            for role, data in role_summaries.items():
                role_lines.append(f"\n[{data.get('role_title', role.upper())}]")
                role_lines.append(f"Summary: {data.get('headline', '')[:80]}")
                for p in data.get("key_points", [])[:2]:
                    role_lines.append(f"  - {p}")
                for a in data.get("action_items", [])[:1]:
                    role_lines.append(f"  Action: {a}")
            text_roles = "EXECUTIVE VIEWS\n" + "\n".join(role_lines) + "\n"

        # Build plain text contradictions
        text_contradictions = ""
        if contradictions:
            contr_lines = []
            for c in contradictions[:3]:
                contr_lines.append(f"- [{c.get('severity', 'medium').upper()}] {c.get('finding_a_summary', '')[:50]} VS {c.get('finding_b_summary', '')[:50]}")
                if c.get("resolution_hint"):
                    contr_lines.append(f"  Hint: {c.get('resolution_hint', '')[:80]}")
            text_contradictions = f"CONTRADICTIONS DETECTED ({len(contradictions)})\n" + "\n".join(contr_lines) + "\n"

        # Build section strings (avoiding backslash in f-strings)
        nl = "\n"
        findings_text = nl.join(f"- {f}" for f in top_findings[:5])
        insights_text = nl.join(f"- {i}" for i in insights[:5])
        predictions_text = nl.join(text_predictions)
        warnings_section = ""
        if warnings:
            warnings_text = nl.join(f"! {w}" for w in warnings[:3])
            warnings_section = f"""
================================================================================
WARNINGS
================================================================================
{warnings_text}
"""

        # Build plain text version
        text_content = f"""
Research Complete: {query}

================================================================================
METRICS
================================================================================
- Findings: {findings_count} ({high_conf} high confidence)
- Sources: {sources_count}
- Execution Time: {exec_time:.1f}s

{text_roles}
{text_contradictions}
================================================================================
TOP FINDINGS
================================================================================
{findings_text}

================================================================================
KEY INSIGHTS
================================================================================
{insights_text}

================================================================================
PREDICTIONS
================================================================================
{predictions_text}

{warnings_section}
---
Generated by Deep Research Actor
Full interactive report attached
"""

        return {
            "subject": subject,
            "html": html_content,
            "text": text_content
        }

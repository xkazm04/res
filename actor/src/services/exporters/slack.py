"""Slack Block Kit exporter for quick sharing."""

from typing import Dict, Any, Optional, List
from datetime import datetime
import json

from .base import BaseExporter, ExportResult


class SlackExporter(BaseExporter):
    """Export research results as Slack Block Kit messages.

    Creates rich, interactive Slack messages using Block Kit:
    - Header with research summary
    - Key findings with context
    - Collapsible sections
    - Action buttons for deeper exploration
    """

    @property
    def format_name(self) -> str:
        return "slack"

    @property
    def mime_type(self) -> str:
        return "application/json"

    @property
    def file_extension(self) -> str:
        return "slack.json"

    def export(
        self,
        research_result: Dict[str, Any],
        title: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> ExportResult:
        """Export to Slack Block Kit format.

        Options:
            channel: Target Slack channel (for metadata)
            include_sources: Include top sources (default: True)
            max_findings: Maximum findings to show (default: 5)
            include_actions: Include action buttons (default: True)
            full_report_url: URL to full report (for button)
        """
        options = options or {}

        query = research_result.get("query", "Unknown Query")
        report_title = title or f"Research Complete: {query[:50]}"
        template = research_result.get("template", "unknown")
        status = research_result.get("status", "unknown")
        session_id = research_result.get("session_id", "")

        findings = research_result.get("findings", [])
        perspectives = research_result.get("perspectives", [])
        sources = research_result.get("sources", [])
        cost = research_result.get("cost_summary", {})

        include_sources = options.get("include_sources", True)
        max_findings = options.get("max_findings", 5)
        include_actions = options.get("include_actions", True)
        full_report_url = options.get("full_report_url", "")
        channel = options.get("channel", "")

        blocks: List[Dict[str, Any]] = []

        # Header block
        status_emoji = "white_check_mark" if status == "completed" else "warning"
        blocks.append({
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": f":{status_emoji}: {report_title}",
                "emoji": True,
            },
        })

        # Context block with metadata
        high_conf = len([f for f in findings if f.get("confidence_score", 0) >= 0.7])
        blocks.append({
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": f":mag: *Template:* {template.title()}",
                },
                {
                    "type": "mrkdwn",
                    "text": f":bar_chart: *Findings:* {len(findings)} ({high_conf} high confidence)",
                },
                {
                    "type": "mrkdwn",
                    "text": f":link: *Sources:* {len(sources)}",
                },
            ],
        })

        blocks.append({"type": "divider"})

        # Query section
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Research Query:*\n>{query}",
            },
        })

        # Key findings
        if findings:
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": ":bulb: *Key Findings*",
                },
            })

            # Sort by confidence and take top N
            top_findings = sorted(
                findings,
                key=lambda x: x.get("confidence_score", 0),
                reverse=True
            )[:max_findings]

            for f in top_findings:
                conf = f.get("confidence_score", 0.5)
                conf_emoji = "green_circle" if conf >= 0.8 else "yellow_circle" if conf >= 0.6 else "red_circle"
                ftype = f.get("finding_type", "fact")
                summary = f.get("summary") or f.get("content", "")[:150]

                blocks.append({
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f":{conf_emoji}: *[{ftype.upper()}]* {summary}\n_Confidence: {conf:.0%}_",
                    },
                })

        # Warnings (if any)
        all_warnings = []
        for p in perspectives:
            all_warnings.extend(p.get("warnings", [])[:2])

        if all_warnings:
            blocks.append({"type": "divider"})
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": ":warning: *Warnings*",
                },
            })

            warning_text = "\n".join([f"• {w}" for w in all_warnings[:3]])
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": warning_text,
                },
            })

        # Key insights from perspectives
        all_insights = []
        for p in perspectives:
            ptype = p.get("perspective_type", "unknown")
            for insight in p.get("key_insights", [])[:1]:
                all_insights.append((ptype, insight))

        if all_insights:
            blocks.append({"type": "divider"})
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": ":crystal_ball: *Expert Insights*",
                },
            })

            for ptype, insight in all_insights[:3]:
                ptype_formatted = ptype.replace("_", " ").title()
                blocks.append({
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": f"*{ptype_formatted}:* {insight}",
                        },
                    ],
                })

        # Top sources
        if include_sources and sources:
            blocks.append({"type": "divider"})
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": ":link: *Top Sources*",
                },
            })

            top_sources = sorted(
                sources,
                key=lambda x: x.get("credibility_score", 0),
                reverse=True
            )[:3]

            source_text = ""
            for s in top_sources:
                src_title = s.get("title", "Unknown")[:40]
                src_url = s.get("url", "")
                cred = s.get("credibility_score", 0.5)
                source_text += f"• <{src_url}|{src_title}> ({cred:.0%} credibility)\n"

            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": source_text,
                },
            })

        # Metadata footer
        blocks.append({"type": "divider"})

        exec_time = research_result.get("execution_time_seconds", 0)
        total_cost = cost.get("total_cost_usd", 0)

        blocks.append({
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": f":stopwatch: {exec_time:.1f}s",
                },
                {
                    "type": "mrkdwn",
                    "text": f":moneybag: ${total_cost:.4f}",
                },
                {
                    "type": "mrkdwn",
                    "text": f":id: `{session_id[:8]}`",
                },
                {
                    "type": "mrkdwn",
                    "text": f":calendar: {datetime.now().strftime('%b %d, %Y %H:%M')}",
                },
            ],
        })

        # Action buttons
        if include_actions:
            action_elements = []

            if full_report_url:
                action_elements.append({
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": ":page_facing_up: View Full Report",
                        "emoji": True,
                    },
                    "url": full_report_url,
                    "action_id": "view_full_report",
                })

            action_elements.append({
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": ":arrows_counterclockwise: Run Again",
                    "emoji": True,
                },
                "action_id": "run_research_again",
                "value": json.dumps({"query": query, "template": template}),
            })

            action_elements.append({
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": ":speech_balloon: Discuss",
                    "emoji": True,
                },
                "action_id": "start_discussion",
                "value": session_id,
            })

            blocks.append({
                "type": "actions",
                "elements": action_elements[:3],  # Slack limits to 5 elements
            })

        # Build complete message payload
        message = {
            "blocks": blocks,
            "text": f"Research Complete: {query[:50]}",  # Fallback text
        }

        if channel:
            message["channel"] = channel

        # Also provide unfurled attachment for link previews
        message["attachments"] = [
            {
                "color": "#36a64f" if status == "completed" else "#f2c744",
                "fallback": f"Research: {query[:100]}",
                "footer": "Deep Research",
                "footer_icon": "https://example.com/research-icon.png",
                "ts": int(datetime.now().timestamp()),
            }
        ]

        return ExportResult(
            format=self.format_name,
            content=json.dumps(message, indent=2, ensure_ascii=False),
            filename=self._generate_filename(report_title, query),
            mime_type=self.mime_type,
            metadata={
                "title": report_title,
                "block_count": len(blocks),
                "channel": channel or "not specified",
                "usage": "POST to Slack chat.postMessage API",
            },
        )

    def export_thread_messages(
        self,
        research_result: Dict[str, Any],
        title: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> List[ExportResult]:
        """Export as multiple thread messages for detailed sharing.

        Returns a list of ExportResults:
        - First message: Summary (use as parent)
        - Follow-up messages: Detailed findings, perspectives, sources
        """
        options = options or {}
        results = []

        # First message - summary
        summary_result = self.export(research_result, title, {
            **options,
            "max_findings": 3,
            "include_sources": False,
        })
        results.append(summary_result)

        findings = research_result.get("findings", [])
        perspectives = research_result.get("perspectives", [])
        sources = research_result.get("sources", [])

        # Findings detail message
        if findings:
            findings_blocks = [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": ":clipboard: All Findings",
                        "emoji": True,
                    },
                }
            ]

            # Group by type
            grouped = {}
            for f in findings:
                ft = f.get("finding_type", "other")
                if ft not in grouped:
                    grouped[ft] = []
                grouped[ft].append(f)

            for ftype, flist in grouped.items():
                findings_blocks.append({
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*{ftype.replace('_', ' ').title()}* ({len(flist)})",
                    },
                })

                for f in flist[:5]:
                    summary = f.get("summary") or f.get("content", "")[:100]
                    conf = f.get("confidence_score", 0.5)
                    findings_blocks.append({
                        "type": "context",
                        "elements": [
                            {
                                "type": "mrkdwn",
                                "text": f"• {summary} ({conf:.0%})",
                            },
                        ],
                    })

            results.append(ExportResult(
                format=self.format_name,
                content=json.dumps({"blocks": findings_blocks}, indent=2),
                filename="findings_thread.slack.json",
                mime_type=self.mime_type,
                metadata={"type": "thread_message", "content": "findings"},
            ))

        # Sources message
        if sources:
            sources_blocks = [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": ":link: Sources",
                        "emoji": True,
                    },
                }
            ]

            sorted_sources = sorted(
                sources,
                key=lambda x: x.get("credibility_score", 0),
                reverse=True
            )[:10]

            for s in sorted_sources:
                src_title = s.get("title", "Unknown")[:50]
                src_url = s.get("url", "")
                domain = s.get("domain", "")
                cred = s.get("credibility_score", 0.5)
                cred_emoji = "green_circle" if cred >= 0.8 else "yellow_circle" if cred >= 0.6 else "red_circle"

                sources_blocks.append({
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": f":{cred_emoji}: <{src_url}|{src_title}> (`{domain}`)",
                        },
                    ],
                })

            results.append(ExportResult(
                format=self.format_name,
                content=json.dumps({"blocks": sources_blocks}, indent=2),
                filename="sources_thread.slack.json",
                mime_type=self.mime_type,
                metadata={"type": "thread_message", "content": "sources"},
            ))

        return results

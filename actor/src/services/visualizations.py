"""Visualization components for rich HTML reports."""

from typing import Dict, Any, List, Optional, Tuple
import html as html_mod
import json
import math


class NetworkVisualization:
    """Generate network graph visualizations for actor/relationship data."""

    # Node type color mapping
    NODE_COLORS = {
        "core": {"bg": "#fff5f5", "border": "#e03131", "text": "#e03131"},
        "person": {"bg": "#fff5f5", "border": "#e03131", "text": "#e03131"},
        "financial": {"bg": "#fff9db", "border": "#f59f00", "text": "#b45309"},
        "finance": {"bg": "#fff9db", "border": "#f59f00", "text": "#b45309"},
        "political": {"bg": "#ebfbee", "border": "#2f9e44", "text": "#2f9e44"},
        "government": {"bg": "#ebfbee", "border": "#2f9e44", "text": "#2f9e44"},
        "intel": {"bg": "#f3f0ff", "border": "#7950f2", "text": "#7950f2"},
        "intelligence": {"bg": "#f3f0ff", "border": "#7950f2", "text": "#7950f2"},
        "corporate": {"bg": "#e7f5ff", "border": "#228be6", "text": "#228be6"},
        "organization": {"bg": "#e7f5ff", "border": "#228be6", "text": "#228be6"},
        "default": {"bg": "#f1f3f5", "border": "#adb5bd", "text": "#495057"},
    }

    # Relationship type styles
    EDGE_STYLES = {
        "financial": {"color": "#f59f00", "width": 3},
        "personal": {"color": "#e03131", "width": 2},
        "professional": {"color": "#228be6", "width": 2},
        "political": {"color": "#2f9e44", "width": 2},
        "criminal": {"color": "#e03131", "width": 3, "dashed": True},
        "default": {"color": "#adb5bd", "width": 1},
    }

    @classmethod
    def extract_network_data(
        cls,
        findings: List[Dict[str, Any]],
    ) -> Tuple[List[Dict], List[Dict]]:
        """Extract actors and relationships from findings."""
        actors = []
        relationships = []
        actor_names = set()

        for finding in findings:
            ftype = finding.get("finding_type", "")
            extracted = finding.get("extracted_data", {}) or {}

            if ftype == "actor":
                name = extracted.get("name", "")
                if not name and finding.get("summary"):
                    # Try to extract name from summary
                    summary = finding.get("summary", "")
                    if " was " in summary:
                        name = summary.split(" was ")[0].strip()
                    elif " is " in summary:
                        name = summary.split(" is ")[0].strip()

                if name and name not in actor_names:
                    actor_names.add(name)
                    actors.append({
                        "name": name,
                        "role": extracted.get("role", ""),
                        "type": cls._classify_actor_type(extracted, finding),
                        "significance": extracted.get("significance", ""),
                        "confidence": finding.get("confidence_score", 0.5),
                    })

            elif ftype == "relationship":
                # Extract relationship data
                rel_type = extracted.get("type", "professional")
                source = extracted.get("source", extracted.get("actor1", ""))
                target = extracted.get("target", extracted.get("actor2", ""))

                if not source or not target:
                    # Try to parse from content
                    content = finding.get("content", "")
                    if " and " in content:
                        parts = content.split(" and ")
                        if len(parts) >= 2:
                            source = parts[0].split()[-1] if parts[0] else ""
                            target = parts[1].split()[0] if parts[1] else ""

                if source and target:
                    relationships.append({
                        "source": source,
                        "target": target,
                        "type": rel_type,
                        "description": finding.get("summary", ""),
                        "confidence": finding.get("confidence_score", 0.5),
                    })

        return actors, relationships

    @classmethod
    def _classify_actor_type(cls, extracted: Dict, finding: Dict) -> str:
        """Classify actor type based on extracted data."""
        role = extracted.get("role", "").lower()
        affiliations = extracted.get("affiliations", "").lower()
        content = finding.get("content", "").lower()

        if any(kw in role + affiliations + content for kw in ["bank", "fund", "financial", "investor"]):
            return "financial"
        if any(kw in role + affiliations + content for kw in ["senator", "governor", "president", "political", "government"]):
            return "political"
        if any(kw in role + affiliations + content for kw in ["cia", "fbi", "intelligence", "agent"]):
            return "intel"
        if any(kw in role + affiliations + content for kw in ["ceo", "coo", "founder", "executive", "company"]):
            return "corporate"
        if any(kw in role + affiliations + content for kw in ["central", "main", "primary", "key"]):
            return "core"

        return "default"

    @classmethod
    def generate_network_html(
        cls,
        actors: List[Dict],
        relationships: List[Dict],
        width: int = 800,
        height: int = 500,
    ) -> str:
        """Generate CSS-positioned network graph HTML."""
        if not actors:
            return '<div class="empty-state">No actor data available for network visualization</div>'

        # Calculate node positions using circular layout
        positions = cls._calculate_positions(actors, width, height)

        # Generate HTML
        html_parts = []
        html_parts.append(f'''
<div class="network-section">
    <div class="network-container" style="position: relative; width: 100%; height: {height}px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; overflow: hidden;">
''')

        # Generate relationship lines first (behind nodes)
        for rel in relationships:
            source_pos = positions.get(rel["source"])
            target_pos = positions.get(rel["target"])

            if source_pos and target_pos:
                style = cls.EDGE_STYLES.get(rel.get("type", ""), cls.EDGE_STYLES["default"])
                line_html = cls._generate_line_html(
                    source_pos, target_pos, style, rel.get("description", "")
                )
                html_parts.append(line_html)

        # Generate actor nodes
        for actor in actors:
            pos = positions.get(actor["name"])
            if pos:
                colors = cls.NODE_COLORS.get(actor.get("type", ""), cls.NODE_COLORS["default"])
                node_html = cls._generate_node_html(actor, pos, colors)
                html_parts.append(node_html)

        html_parts.append('    </div>')

        # Generate legend
        html_parts.append(cls._generate_legend(actors))

        html_parts.append('</div>')

        return '\n'.join(html_parts)

    @classmethod
    def _calculate_positions(
        cls,
        actors: List[Dict],
        width: int,
        height: int,
    ) -> Dict[str, Tuple[int, int]]:
        """Calculate node positions using circular layout with importance weighting."""
        positions = {}
        n = len(actors)
        if n == 0:
            return positions

        # Sort by confidence (importance)
        sorted_actors = sorted(actors, key=lambda a: a.get("confidence", 0.5), reverse=True)

        # Place most important in center, others in circle
        center_x = width // 2
        center_y = height // 2
        radius = min(width, height) * 0.35

        for i, actor in enumerate(sorted_actors):
            if i == 0 and n > 3:
                # Most important actor in center
                positions[actor["name"]] = (center_x, center_y)
            else:
                # Others in circle
                angle = (2 * math.pi * (i - 1 if n > 3 else i)) / (n - 1 if n > 3 else n)
                x = int(center_x + radius * math.cos(angle))
                y = int(center_y + radius * math.sin(angle))
                positions[actor["name"]] = (x, y)

        return positions

    @classmethod
    def _generate_node_html(
        cls,
        actor: Dict,
        pos: Tuple[int, int],
        colors: Dict[str, str],
    ) -> str:
        """Generate HTML for a single actor node."""
        name = html_mod.escape(actor.get("name", "Unknown"))
        role = html_mod.escape(actor.get("role", ""))[:30]
        conf = actor.get("confidence", 0.5)

        x, y = pos
        return f'''
        <div class="network-node" style="
            position: absolute;
            left: {x}px;
            top: {y}px;
            transform: translate(-50%, -50%);
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            cursor: pointer;
            border: 2px solid {colors['border']};
            background: {colors['bg']};
            color: {colors['text']};
            z-index: 10;
            transition: transform 0.2s, box-shadow 0.2s;
        " title="{role} (Confidence: {conf:.0%})"
           onmouseover="this.style.transform='translate(-50%, -50%) scale(1.1)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';"
           onmouseout="this.style.transform='translate(-50%, -50%)'; this.style.boxShadow='none';">
            {name}
        </div>'''

    @classmethod
    def _generate_line_html(
        cls,
        source_pos: Tuple[int, int],
        target_pos: Tuple[int, int],
        style: Dict[str, Any],
        description: str,
    ) -> str:
        """Generate HTML/SVG for relationship line."""
        x1, y1 = source_pos
        x2, y2 = target_pos

        # Calculate line properties
        length = math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
        angle = math.atan2(y2 - y1, x2 - x1) * 180 / math.pi

        color = style.get("color", "#adb5bd")
        width = style.get("width", 1)
        dashed = "5,5" if style.get("dashed") else ""

        return f'''
        <svg style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1;">
            <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"
                  stroke="{color}" stroke-width="{width}" stroke-dasharray="{dashed}"
                  opacity="0.6">
                <title>{html_mod.escape(description)}</title>
            </line>
        </svg>'''

    @classmethod
    def _generate_legend(cls, actors: List[Dict]) -> str:
        """Generate legend showing node types present in the network."""
        # Find unique types in the data
        types_present = set(a.get("type", "default") for a in actors)

        legend_items = []
        for node_type in types_present:
            colors = cls.NODE_COLORS.get(node_type, cls.NODE_COLORS["default"])
            label = node_type.replace("_", " ").title()
            legend_items.append(f'''
            <div class="legend-item" style="display: flex; align-items: center; gap: 6px;">
                <div style="width: 12px; height: 12px; border-radius: 2px; background: {colors['bg']}; border: 2px solid {colors['border']};"></div>
                <span style="font-size: 11px; color: #495057;">{label}</span>
            </div>''')

        return f'''
    <div class="network-legend" style="display: flex; gap: 16px; margin-top: 12px; flex-wrap: wrap;">
        {''.join(legend_items)}
    </div>'''


class TimelineVisualization:
    """Generate parallel timeline visualizations."""

    STREAM_COLORS = {
        "legal": "#e03131",
        "financial": "#f59f00",
        "public": "#228be6",
        "regulatory": "#2f9e44",
        "corporate": "#7950f2",
        "default": "#868e96",
    }

    @classmethod
    def extract_timeline_data(
        cls,
        findings: List[Dict[str, Any]],
    ) -> Dict[str, List[Dict]]:
        """Extract and group events by stream/category."""
        streams: Dict[str, List[Dict]] = {}

        for finding in findings:
            ftype = finding.get("finding_type", "")
            if ftype not in ["event", "financial"]:
                continue

            extracted = finding.get("extracted_data", {}) or {}
            event_date = finding.get("event_date") or extracted.get("date", "")

            # Determine stream
            stream = cls._classify_stream(finding)

            if stream not in streams:
                streams[stream] = []

            streams[stream].append({
                "date": event_date,
                "year": cls._extract_year(event_date),
                "summary": finding.get("summary", "")[:80],
                "content": finding.get("content", ""),
                "confidence": finding.get("confidence_score", 0.5),
                "type": ftype,
            })

        # Sort events within each stream by date
        for stream in streams:
            streams[stream] = sorted(
                streams[stream],
                key=lambda e: e.get("date", "") or e.get("year", ""),
            )

        return streams

    @classmethod
    def _classify_stream(cls, finding: Dict) -> str:
        """Classify event into a stream category."""
        content = finding.get("content", "").lower()
        summary = finding.get("summary", "").lower()
        ftype = finding.get("finding_type", "")
        text = content + " " + summary

        if ftype == "financial" or any(kw in text for kw in ["payment", "fund", "invest", "million", "billion"]):
            return "financial"
        if any(kw in text for kw in ["court", "trial", "lawsuit", "legal", "guilty", "sentence"]):
            return "legal"
        if any(kw in text for kw in ["sec", "fda", "regulatory", "compliance", "audit"]):
            return "regulatory"
        if any(kw in text for kw in ["public", "media", "press", "announce", "news"]):
            return "public"
        if any(kw in text for kw in ["company", "corporate", "ceo", "board"]):
            return "corporate"

        return "default"

    @classmethod
    def _extract_year(cls, date_str: str) -> str:
        """Extract year from date string."""
        if not date_str:
            return ""
        # Handle various formats
        for fmt in ["%Y-%m-%d", "%Y-%m", "%Y", "%B %Y", "%B %d, %Y"]:
            try:
                from datetime import datetime
                dt = datetime.strptime(date_str[:10], fmt[:len(date_str[:10])])
                return str(dt.year)
            except (ValueError, IndexError):
                continue
        # Try to find 4-digit year
        import re
        match = re.search(r'(19|20)\d{2}', date_str)
        if match:
            return match.group()
        return ""

    @classmethod
    def generate_timeline_html(
        cls,
        streams: Dict[str, List[Dict]],
    ) -> str:
        """Generate parallel timeline HTML."""
        if not streams:
            return '<div class="empty-state">No timeline data available</div>'

        # Get all unique years
        all_years = set()
        for events in streams.values():
            for event in events:
                year = event.get("year", "")
                if year:
                    all_years.add(year)

        if not all_years:
            return '<div class="empty-state">No dated events for timeline</div>'

        years = sorted(all_years)
        stream_names = list(streams.keys())

        # Build HTML
        html_parts = []
        html_parts.append('''
<div class="timeline-section">
    <div class="parallel-timeline" style="display: grid; grid-template-columns: 80px repeat(''' + str(len(stream_names)) + ''', 1fr); gap: 1px; background: #dee2e6; border: 1px solid #dee2e6; border-radius: 6px; overflow: hidden;">
''')

        # Header row
        html_parts.append('<div class="timeline-header" style="background: #f1f3f5; padding: 10px 8px; font-size: 10px; font-weight: 600; text-transform: uppercase; text-align: center;">Year</div>')
        for stream in stream_names:
            color = cls.STREAM_COLORS.get(stream, cls.STREAM_COLORS["default"])
            html_parts.append(f'<div class="timeline-header" style="background: #f1f3f5; padding: 10px 8px; font-size: 10px; font-weight: 600; text-transform: uppercase; text-align: center; color: {color};">{stream.title()}</div>')

        # Data rows by year
        for year in years:
            html_parts.append(f'<div class="timeline-year" style="background: #f8f9fa; padding: 8px; font-weight: 600; font-size: 12px; text-align: center;">{year}</div>')

            for stream in stream_names:
                events = [e for e in streams.get(stream, []) if e.get("year") == year]
                color = cls.STREAM_COLORS.get(stream, cls.STREAM_COLORS["default"])

                html_parts.append('<div class="timeline-cell" style="background: #ffffff; padding: 8px; min-height: 60px; font-size: 11px;">')
                for event in events:
                    html_parts.append(f'''
                    <div class="timeline-event" style="padding: 4px 6px; border-radius: 3px; margin: 2px 0; font-size: 10px; line-height: 1.3; background: {color}15; border-left: 2px solid {color};" title="{html_mod.escape(event.get('content', '')[:200])}">
                        {html_mod.escape(event.get('summary', ''))}
                    </div>''')
                html_parts.append('</div>')

        html_parts.append('    </div>')

        # Legend
        html_parts.append('<div class="timeline-legend" style="display: flex; gap: 16px; margin-top: 12px; flex-wrap: wrap;">')
        for stream in stream_names:
            color = cls.STREAM_COLORS.get(stream, cls.STREAM_COLORS["default"])
            html_parts.append(f'''
            <div style="display: flex; align-items: center; gap: 6px;">
                <div style="width: 12px; height: 12px; border-radius: 2px; background: {color};"></div>
                <span style="font-size: 11px; color: #495057;">{stream.title()}</span>
            </div>''')
        html_parts.append('</div>')

        html_parts.append('</div>')

        return '\n'.join(html_parts)


class MoneyFlowVisualization:
    """Generate Sankey-style money flow diagrams."""

    @classmethod
    def extract_flow_data(
        cls,
        findings: List[Dict[str, Any]],
    ) -> List[Dict]:
        """Extract financial flow data from findings."""
        flows = []

        for finding in findings:
            if finding.get("finding_type") != "financial":
                continue

            extracted = finding.get("extracted_data", {}) or {}
            amount = extracted.get("amount")
            payer = extracted.get("payer", "")
            payee = extracted.get("payee", "")

            if amount and payer and payee:
                # Normalize amount to number
                if isinstance(amount, str):
                    amount = cls._parse_amount(amount)

                flows.append({
                    "source": payer,
                    "target": payee,
                    "amount": amount,
                    "type": extracted.get("transaction_type", "payment"),
                    "date": extracted.get("transaction_date", ""),
                    "purpose": extracted.get("purpose", ""),
                    "confidence": finding.get("confidence_score", 0.5),
                })

        # Sort by amount descending
        flows = sorted(flows, key=lambda f: f.get("amount", 0) or 0, reverse=True)
        return flows

    @classmethod
    def _parse_amount(cls, amount_str: str) -> float:
        """Parse amount string to float."""
        import re
        # Remove currency symbols and commas
        cleaned = re.sub(r'[,$]', '', str(amount_str))
        # Handle millions/billions
        multiplier = 1
        if 'million' in amount_str.lower() or 'm' in amount_str.lower():
            multiplier = 1_000_000
        elif 'billion' in amount_str.lower() or 'b' in amount_str.lower():
            multiplier = 1_000_000_000

        try:
            base = float(re.search(r'[\d.]+', cleaned).group())
            return base * multiplier
        except (AttributeError, ValueError):
            return 0

    @classmethod
    def generate_flow_html(
        cls,
        flows: List[Dict],
        max_flows: int = 10,
    ) -> str:
        """Generate Sankey-style money flow HTML."""
        if not flows:
            return '<div class="empty-state">No financial flow data available</div>'

        flows = flows[:max_flows]
        max_amount = max(f.get("amount", 0) or 1 for f in flows)

        html_parts = []
        html_parts.append('''
<div class="flow-section">
    <div class="flow-container" style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; padding: 20px;">
''')

        for flow in flows:
            amount = flow.get("amount", 0) or 0
            # Calculate relative width (min 20%, max 100%)
            width_pct = max(20, min(100, (amount / max_amount) * 100))

            # Determine thickness class
            thickness = "thick" if width_pct > 60 else "medium" if width_pct > 30 else "thin"
            line_height = 12 if thickness == "thick" else 8 if thickness == "medium" else 4

            source = html_mod.escape(flow.get("source", "Unknown"))
            target = html_mod.escape(flow.get("target", "Unknown"))
            amount_str = cls._format_amount(amount)
            purpose = html_mod.escape(flow.get("purpose", "")[:50])

            html_parts.append(f'''
        <div class="flow-row" style="display: flex; align-items: center; margin: 16px 0;" title="{purpose}">
            <div class="flow-source" style="width: 160px; padding: 10px; border-radius: 4px; font-size: 11px; font-weight: 600; text-align: center; background: #e7f5ff; color: #228be6;">
                {source}
            </div>
            <div class="flow-line" style="flex: 1; margin: 0 12px; position: relative;">
                <div class="flow-amount" style="position: absolute; top: -18px; left: 50%; transform: translateX(-50%); font-size: 11px; font-weight: 700; white-space: nowrap; color: #495057;">
                    {amount_str}
                </div>
                <div class="flow-line-inner" style="height: {line_height}px; background: linear-gradient(90deg, #228be6, #e03131); border-radius: 4px; width: {width_pct}%;"></div>
            </div>
            <div class="flow-target" style="width: 160px; padding: 10px; border-radius: 4px; font-size: 11px; font-weight: 600; text-align: center; background: #fff5f5; color: #e03131;">
                {target}
            </div>
        </div>''')

        html_parts.append('    </div>')

        # Summary
        total = sum(f.get("amount", 0) or 0 for f in flows)
        html_parts.append(f'''
    <div class="flow-summary" style="margin-top: 12px; font-size: 12px; color: #495057;">
        <strong>Total tracked:</strong> {cls._format_amount(total)} across {len(flows)} transactions
    </div>
</div>''')

        return '\n'.join(html_parts)

    @classmethod
    def _format_amount(cls, amount: float) -> str:
        """Format amount for display."""
        if amount >= 1_000_000_000:
            return f"${amount / 1_000_000_000:.1f}B"
        if amount >= 1_000_000:
            return f"${amount / 1_000_000:.1f}M"
        if amount >= 1_000:
            return f"${amount / 1_000:.1f}K"
        return f"${amount:,.0f}"


class StakeholderImpactMatrix:
    """Generate stakeholder impact analysis matrix."""

    # Impact level colors
    IMPACT_COLORS = {
        "positive": {"bg": "#d1fae5", "text": "#065f46", "symbol": "+"},
        "negative": {"bg": "#fee2e2", "text": "#991b1b", "symbol": "-"},
        "neutral": {"bg": "#f1f5f9", "text": "#64748b", "symbol": "~"},
        "mixed": {"bg": "#fef3c7", "text": "#92400e", "symbol": "±"},
    }

    # Common stakeholder categories
    STAKEHOLDER_CATEGORIES = [
        "investors", "customers", "employees", "regulators",
        "competitors", "partners", "suppliers", "public"
    ]

    @classmethod
    def extract_stakeholders(cls, findings: List[Dict], perspectives: List[Dict]) -> List[str]:
        """Extract stakeholder groups from findings and perspectives."""
        stakeholders = set()

        # Extract from findings
        for f in findings:
            content = (f.get("content", "") + " " + f.get("summary", "")).lower()
            for category in cls.STAKEHOLDER_CATEGORIES:
                if category in content or category[:-1] in content:  # "investor" or "investors"
                    stakeholders.add(category.title())

            # Also check extracted_data
            extracted = f.get("extracted_data", {}) or {}
            if extracted.get("stakeholders"):
                for s in extracted.get("stakeholders", []):
                    stakeholders.add(s.title() if isinstance(s, str) else str(s))

        # Extract from perspective warnings/recommendations
        for p in perspectives:
            recommendations = p.get("recommendations", [])
            for rec in recommendations:
                rec_lower = rec.lower() if isinstance(rec, str) else ""
                for category in cls.STAKEHOLDER_CATEGORIES:
                    if category in rec_lower:
                        stakeholders.add(category.title())

        # Ensure we have at least some stakeholders
        if not stakeholders:
            stakeholders = {"Investors", "Customers", "Regulators"}

        return sorted(list(stakeholders))[:6]  # Max 6 stakeholders

    @classmethod
    def analyze_impacts(
        cls,
        findings: List[Dict],
        stakeholders: List[str],
    ) -> List[Dict]:
        """Analyze impact of key findings on each stakeholder group."""
        # Get top findings by confidence
        key_findings = sorted(
            findings,
            key=lambda f: f.get("confidence_score", 0.5),
            reverse=True
        )[:8]

        impact_data = []
        for finding in key_findings:
            summary = finding.get("summary", "")[:60]
            content = finding.get("content", "").lower()
            ftype = finding.get("finding_type", "")

            impacts = {}
            for stakeholder in stakeholders:
                stakeholder_lower = stakeholder.lower()
                # Simple heuristic-based impact analysis
                impact = cls._determine_impact(content, ftype, stakeholder_lower)
                impacts[stakeholder] = impact

            impact_data.append({
                "summary": summary,
                "type": ftype,
                "impacts": impacts,
            })

        return impact_data

    @classmethod
    def _determine_impact(cls, content: str, finding_type: str, stakeholder: str) -> str:
        """Determine impact on stakeholder based on content and type."""
        # Negative indicators
        negative_words = ["loss", "decline", "risk", "threat", "penalty", "fine", "lawsuit", "violation"]
        positive_words = ["growth", "gain", "opportunity", "benefit", "improve", "increase", "success"]

        has_negative = any(word in content for word in negative_words)
        has_positive = any(word in content for word in positive_words)
        mentions_stakeholder = stakeholder in content or stakeholder[:-1] in content

        if finding_type in ["red_flag", "suspicious_element"]:
            if stakeholder in ["investors", "customers", "regulators"]:
                return "negative"

        if has_positive and has_negative:
            return "mixed"
        if has_negative:
            return "negative" if mentions_stakeholder else "neutral"
        if has_positive:
            return "positive" if mentions_stakeholder else "neutral"

        return "neutral"

    @classmethod
    def generate_matrix_html(
        cls,
        impact_data: List[Dict],
        stakeholders: List[str],
    ) -> str:
        """Generate stakeholder impact matrix HTML."""
        if not impact_data or not stakeholders:
            return '<div class="empty-state">No stakeholder impact data available</div>'

        html_parts = []
        html_parts.append('''
<div class="impact-matrix-section">
    <style>
        .impact-matrix { width: 100%; border-collapse: collapse; font-size: 12px; }
        .impact-matrix th { background: #f1f3f5; padding: 8px 6px; text-align: center; font-weight: 600; border: 1px solid #dee2e6; }
        .impact-matrix th.finding-col { text-align: left; min-width: 200px; }
        .impact-matrix td { padding: 8px 6px; text-align: center; border: 1px solid #dee2e6; }
        .impact-matrix td.finding-cell { text-align: left; font-size: 11px; }
        .impact-cell { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 4px; font-weight: 700; font-size: 14px; }
        .impact-legend { display: flex; gap: 16px; margin-top: 12px; font-size: 11px; flex-wrap: wrap; }
        .legend-item { display: flex; align-items: center; gap: 6px; }
    </style>
    <table class="impact-matrix">
        <thead>
            <tr>
                <th class="finding-col">Key Finding</th>
''')

        # Header row with stakeholders
        for stakeholder in stakeholders:
            html_parts.append(f'                <th>{html_mod.escape(stakeholder)}</th>\n')
        html_parts.append('            </tr>\n        </thead>\n        <tbody>\n')

        # Data rows
        for row in impact_data:
            html_parts.append(f'            <tr>\n')
            html_parts.append(f'                <td class="finding-cell">{html_mod.escape(row["summary"])}</td>\n')

            for stakeholder in stakeholders:
                impact = row["impacts"].get(stakeholder, "neutral")
                colors = cls.IMPACT_COLORS.get(impact, cls.IMPACT_COLORS["neutral"])
                html_parts.append(
                    f'                <td><span class="impact-cell" style="background:{colors["bg"]};color:{colors["text"]};">'
                    f'{colors["symbol"]}</span></td>\n'
                )

            html_parts.append('            </tr>\n')

        html_parts.append('        </tbody>\n    </table>\n')

        # Legend
        html_parts.append('    <div class="impact-legend">\n')
        for impact_type, colors in cls.IMPACT_COLORS.items():
            html_parts.append(
                f'        <div class="legend-item">'
                f'<span class="impact-cell" style="background:{colors["bg"]};color:{colors["text"]};width:20px;height:20px;font-size:12px;">'
                f'{colors["symbol"]}</span>{impact_type.title()}</div>\n'
            )
        html_parts.append('    </div>\n</div>')

        return ''.join(html_parts)


class PredictionTimeline:
    """Generate prediction timeline visualization grouped by timeframe."""

    TIMEFRAME_ORDER = ["immediate", "q1", "q2", "q3", "q4", "2025", "2026", "long-term"]

    @classmethod
    def group_predictions_by_timeline(cls, perspectives: List[Dict]) -> Dict[str, List[Dict]]:
        """Group predictions by their timeline/timeframe."""
        grouped: Dict[str, List[Dict]] = {}

        for p in perspectives:
            predictions = p.get("predictions", [])
            perspective_type = p.get("perspective_type", "unknown")

            for pred in predictions:
                if isinstance(pred, dict):
                    timeline = pred.get("timeline", "").lower() if pred.get("timeline") else "unspecified"
                    prediction_text = pred.get("prediction", "")
                    confidence = pred.get("confidence", "medium")
                else:
                    timeline = "unspecified"
                    prediction_text = str(pred)
                    confidence = "medium"

                # Normalize timeline to standard categories
                normalized_timeline = cls._normalize_timeline(timeline)

                if normalized_timeline not in grouped:
                    grouped[normalized_timeline] = []

                grouped[normalized_timeline].append({
                    "text": prediction_text,
                    "confidence": confidence if isinstance(confidence, str) else (
                        "high" if confidence >= 0.8 else "medium" if confidence >= 0.5 else "low"
                    ),
                    "source": perspective_type,
                    "rationale": pred.get("rationale", "") if isinstance(pred, dict) else "",
                })

        return grouped

    @classmethod
    def _normalize_timeline(cls, timeline: str) -> str:
        """Normalize timeline string to standard category."""
        if not timeline:
            return "Unspecified"

        timeline_lower = timeline.lower()

        if any(term in timeline_lower for term in ["immediate", "now", "current"]):
            return "Immediate"
        if "q1" in timeline_lower or "quarter 1" in timeline_lower:
            return "Q1"
        if "q2" in timeline_lower or "quarter 2" in timeline_lower:
            return "Q2"
        if "q3" in timeline_lower or "quarter 3" in timeline_lower:
            return "Q3"
        if "q4" in timeline_lower or "quarter 4" in timeline_lower:
            return "Q4"
        if "2025" in timeline_lower:
            return "2025"
        if "2026" in timeline_lower:
            return "2026"
        if any(term in timeline_lower for term in ["long", "future", "years"]):
            return "Long-term"
        if any(term in timeline_lower for term in ["month", "near"]):
            return "Near-term"

        return timeline.title()[:20]

    @classmethod
    def generate_timeline_html(cls, grouped_predictions: Dict[str, List[Dict]]) -> str:
        """Generate prediction timeline HTML."""
        if not grouped_predictions:
            return '<div class="empty-state">No predictions available</div>'

        # Sort timelines
        sorted_timelines = sorted(
            grouped_predictions.keys(),
            key=lambda t: cls.TIMEFRAME_ORDER.index(t.lower()) if t.lower() in cls.TIMEFRAME_ORDER else 99
        )

        html_parts = []
        html_parts.append('''
<div class="prediction-timeline">
    <style>
        .pred-timeline-row { display: flex; margin-bottom: 24px; }
        .pred-timeline-label { width: 100px; flex-shrink: 0; font-weight: 600; font-size: 12px; color: #6366f1; padding-top: 4px; }
        .pred-timeline-items { flex: 1; display: flex; flex-wrap: wrap; gap: 8px; }
        .pred-timeline-card { background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border: 1px solid #bae6fd; border-radius: 6px; padding: 10px 12px; max-width: 300px; }
        .pred-timeline-text { font-size: 12px; color: #1e293b; margin-bottom: 6px; line-height: 1.4; }
        .pred-timeline-meta { display: flex; gap: 8px; align-items: center; font-size: 10px; }
        .pred-source { color: #6b7280; }
        .pred-conf { padding: 2px 6px; border-radius: 4px; font-weight: 600; }
        .pred-conf-high { background: #d1fae5; color: #065f46; }
        .pred-conf-medium { background: #fef3c7; color: #92400e; }
        .pred-conf-low { background: #f1f5f9; color: #64748b; }
    </style>
''')

        for timeline in sorted_timelines:
            predictions = grouped_predictions[timeline]
            html_parts.append(f'    <div class="pred-timeline-row">\n')
            html_parts.append(f'        <div class="pred-timeline-label">{html_mod.escape(timeline)}</div>\n')
            html_parts.append('        <div class="pred-timeline-items">\n')

            for pred in predictions[:4]:  # Max 4 per timeline
                conf_class = f"pred-conf-{pred['confidence']}"
                html_parts.append(f'''            <div class="pred-timeline-card">
                <div class="pred-timeline-text">{html_mod.escape(pred["text"][:150])}</div>
                <div class="pred-timeline-meta">
                    <span class="pred-source">{html_mod.escape(pred["source"].replace("_", " ").title())}</span>
                    <span class="pred-conf {conf_class}">{pred["confidence"].upper()}</span>
                </div>
            </div>\n''')

            html_parts.append('        </div>\n    </div>\n')

        html_parts.append('</div>')

        return ''.join(html_parts)


class FinancialTables:
    """Generate financial data tables for earnings, valuations, and metrics."""

    @classmethod
    def extract_financial_metrics(cls, findings: List[Dict]) -> Dict[str, List[Dict]]:
        """Extract financial metrics from findings."""
        metrics = {
            "earnings": [],
            "revenue": [],
            "margins": [],
            "valuations": [],
            "other": [],
        }

        for f in findings:
            if f.get("finding_type") != "financial":
                continue

            extracted = f.get("extracted_data", {}) or {}
            metric_type = extracted.get("metric_type", "").lower()
            content = f.get("content", "").lower()

            metric_entry = {
                "period": extracted.get("period", extracted.get("quarter", "")),
                "value": extracted.get("amount", extracted.get("value", "")),
                "company": extracted.get("company", extracted.get("entity", "")),
                "comparison": extracted.get("comparison", ""),
                "change": extracted.get("change", extracted.get("growth", "")),
                "confidence": f.get("confidence_score", 0.5),
            }

            if any(term in metric_type + content for term in ["eps", "earning", "profit", "income"]):
                metrics["earnings"].append(metric_entry)
            elif any(term in metric_type + content for term in ["revenue", "sales", "top line"]):
                metrics["revenue"].append(metric_entry)
            elif any(term in metric_type + content for term in ["margin", "gross", "operating"]):
                metrics["margins"].append(metric_entry)
            elif any(term in metric_type + content for term in ["p/e", "valuation", "multiple", "ev"]):
                metrics["valuations"].append(metric_entry)
            else:
                metrics["other"].append(metric_entry)

        return metrics

    @classmethod
    def generate_financial_table_html(cls, metrics: Dict[str, List[Dict]]) -> str:
        """Generate HTML tables for financial metrics."""
        if not any(metrics.values()):
            return '<div class="empty-state">No financial metrics data available</div>'

        html_parts = []
        html_parts.append('''
<div class="financial-tables">
    <style>
        .fin-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px; }
        .fin-table th { background: #f1f3f5; padding: 8px 10px; text-align: left; font-weight: 600; border: 1px solid #dee2e6; }
        .fin-table td { padding: 8px 10px; border: 1px solid #dee2e6; }
        .fin-table tr:nth-child(even) { background: #f8f9fa; }
        .fin-section-title { font-weight: 600; color: #1e293b; font-size: 13px; margin: 12px 0 8px; }
        .fin-value { font-weight: 600; color: #1e293b; }
        .fin-change-positive { color: #059669; }
        .fin-change-negative { color: #dc2626; }
    </style>
''')

        for category, items in metrics.items():
            if not items:
                continue

            html_parts.append(f'    <div class="fin-section-title">{category.title()}</div>\n')
            html_parts.append('    <table class="fin-table">\n')
            html_parts.append('        <thead><tr><th>Company</th><th>Period</th><th>Value</th><th>Change</th></tr></thead>\n')
            html_parts.append('        <tbody>\n')

            for item in items[:8]:
                company = html_mod.escape(str(item.get("company", "N/A"))[:30])
                period = html_mod.escape(str(item.get("period", "N/A"))[:20])
                value = html_mod.escape(str(item.get("value", "N/A"))[:20])
                change = str(item.get("change", ""))
                change_class = "fin-change-positive" if "+" in change or "up" in change.lower() else \
                              "fin-change-negative" if "-" in change or "down" in change.lower() else ""

                html_parts.append(f'            <tr>\n')
                html_parts.append(f'                <td>{company}</td>\n')
                html_parts.append(f'                <td>{period}</td>\n')
                html_parts.append(f'                <td class="fin-value">{value}</td>\n')
                html_parts.append(f'                <td class="{change_class}">{html_mod.escape(change[:20])}</td>\n')
                html_parts.append(f'            </tr>\n')

            html_parts.append('        </tbody>\n    </table>\n')

        html_parts.append('</div>')
        return ''.join(html_parts)


class FeatureComparisonMatrix:
    """Generate feature comparison matrix for tech products."""

    @classmethod
    def extract_features(cls, findings: List[Dict]) -> Dict[str, Dict[str, str]]:
        """Extract product features from findings."""
        products = {}

        for f in findings:
            extracted = f.get("extracted_data", {}) or {}
            product = extracted.get("product", extracted.get("tool", extracted.get("company", "")))
            feature = extracted.get("feature", "")
            value = extracted.get("value", extracted.get("capability", ""))

            if product and feature:
                if product not in products:
                    products[product] = {}
                products[product][feature] = value or ""

        return products

    @classmethod
    def generate_comparison_html(cls, products: Dict[str, Dict[str, str]]) -> str:
        """Generate feature comparison matrix HTML."""
        if not products:
            return '<div class="empty-state">No feature comparison data available</div>'

        # Get all unique features
        all_features = set()
        for features in products.values():
            all_features.update(features.keys())
        features_list = sorted(all_features)[:12]  # Max 12 features
        product_list = list(products.keys())[:6]  # Max 6 products

        html_parts = []
        html_parts.append('''
<div class="comparison-matrix">
    <style>
        .comp-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .comp-table th { background: #f1f3f5; padding: 8px; text-align: center; font-weight: 600; border: 1px solid #dee2e6; }
        .comp-table th.feature-col { text-align: left; width: 150px; }
        .comp-table td { padding: 8px; text-align: center; border: 1px solid #dee2e6; }
        .comp-check { color: #059669; font-weight: bold; }
        .comp-cross { color: #dc2626; }
        .comp-partial { color: #d97706; }
    </style>
    <table class="comp-table">
        <thead>
            <tr>
                <th class="feature-col">Feature</th>
''')

        for product in product_list:
            html_parts.append(f'                <th>{html_mod.escape(product[:20])}</th>\n')
        html_parts.append('            </tr>\n        </thead>\n        <tbody>\n')

        for feature in features_list:
            html_parts.append(f'            <tr>\n')
            html_parts.append(f'                <td class="feature-col">{html_mod.escape(feature[:30])}</td>\n')

            for product in product_list:
                value = products.get(product, {}).get(feature, "")
                if value:
                    if value.lower() in ["yes", "true", ""]:
                        html_parts.append('                <td class="comp-check">OK</td>\n')
                    elif value.lower() in ["no", "false", ""]:
                        html_parts.append('                <td class="comp-cross">X</td>\n')
                    elif value.lower() in ["partial", "limited"]:
                        html_parts.append('                <td class="comp-partial">~</td>\n')
                    else:
                        html_parts.append(f'                <td>{html_mod.escape(str(value)[:15])}</td>\n')
                else:
                    html_parts.append('                <td>-</td>\n')

            html_parts.append('            </tr>\n')

        html_parts.append('        </tbody>\n    </table>\n</div>')
        return ''.join(html_parts)


class ContractPricingTable:
    """Generate contract pricing and benchmark tables."""

    @classmethod
    def extract_pricing_data(cls, findings: List[Dict]) -> List[Dict]:
        """Extract contract pricing data from findings."""
        pricing = []

        for f in findings:
            if f.get("finding_type") not in ["financial", "contract", "pricing"]:
                continue

            extracted = f.get("extracted_data", {}) or {}
            content = f.get("content", "").lower()

            if any(term in content for term in ["price", "cost", "rate", "fee", "value"]):
                pricing.append({
                    "item": extracted.get("item", extracted.get("service", ""))[:50],
                    "vendor": extracted.get("vendor", extracted.get("contractor", "")),
                    "price": extracted.get("price", extracted.get("amount", "")),
                    "benchmark": extracted.get("benchmark", ""),
                    "variance": extracted.get("variance", extracted.get("difference", "")),
                    "confidence": f.get("confidence_score", 0.5),
                })

        return pricing

    @classmethod
    def generate_pricing_table_html(cls, pricing: List[Dict]) -> str:
        """Generate pricing benchmark table HTML."""
        if not pricing:
            return '<div class="empty-state">No pricing data available</div>'

        html_parts = []
        html_parts.append('''
<div class="pricing-table-section">
    <style>
        .price-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .price-table th { background: #f1f3f5; padding: 8px 10px; text-align: left; font-weight: 600; border: 1px solid #dee2e6; }
        .price-table td { padding: 8px 10px; border: 1px solid #dee2e6; }
        .price-table tr:nth-child(even) { background: #f8f9fa; }
        .price-value { font-weight: 600; }
        .variance-over { color: #dc2626; background: #fee2e2; padding: 2px 6px; border-radius: 3px; }
        .variance-under { color: #059669; background: #d1fae5; padding: 2px 6px; border-radius: 3px; }
    </style>
    <table class="price-table">
        <thead>
            <tr>
                <th>Item/Service</th>
                <th>Vendor</th>
                <th>Price</th>
                <th>Benchmark</th>
                <th>Variance</th>
            </tr>
        </thead>
        <tbody>
''')

        for item in pricing[:10]:
            variance = str(item.get("variance", ""))
            variance_class = "variance-over" if "over" in variance.lower() or "+" in variance else \
                            "variance-under" if "under" in variance.lower() or "-" in variance else ""

            html_parts.append(f'''            <tr>
                <td>{html_mod.escape(str(item.get("item", "N/A"))[:40])}</td>
                <td>{html_mod.escape(str(item.get("vendor", "N/A"))[:25])}</td>
                <td class="price-value">{html_mod.escape(str(item.get("price", "N/A"))[:15])}</td>
                <td>{html_mod.escape(str(item.get("benchmark", "-"))[:15])}</td>
                <td><span class="{variance_class}">{html_mod.escape(variance[:15])}</span></td>
            </tr>\n''')

        html_parts.append('        </tbody>\n    </table>\n</div>')
        return ''.join(html_parts)


class EvidenceChain:
    """Generate evidence chain visualization for investigative reports."""

    @classmethod
    def build_evidence_chain(cls, findings: List[Dict]) -> List[Dict]:
        """Build evidence chain from findings."""
        chain = []

        # Get findings that have evidence/claims
        for f in findings:
            if f.get("finding_type") not in ["fact", "claim", "evidence"]:
                continue

            extracted = f.get("extracted_data", {}) or {}
            supporting = f.get("supporting_sources", [])

            chain.append({
                "claim": f.get("summary", "")[:100],
                "evidence_type": f.get("finding_type", ""),
                "source_count": len(supporting),
                "sources": [s.get("title", s.get("url", ""))[:40] for s in supporting[:3]],
                "confidence": f.get("confidence_score", 0.5),
                "corroborated": len(supporting) > 1,
            })

        # Sort by confidence
        chain = sorted(chain, key=lambda c: c["confidence"], reverse=True)
        return chain[:10]

    @classmethod
    def generate_chain_html(cls, chain: List[Dict]) -> str:
        """Generate evidence chain visualization HTML."""
        if not chain:
            return '<div class="empty-state">No evidence chain data available</div>'

        html_parts = []
        html_parts.append('''
<div class="evidence-chain-section">
    <style>
        .ev-chain { display: flex; flex-direction: column; gap: 12px; }
        .ev-chain-item { display: flex; gap: 12px; align-items: flex-start; }
        .ev-chain-connector { width: 24px; display: flex; flex-direction: column; align-items: center; }
        .ev-chain-dot { width: 12px; height: 12px; border-radius: 50%; background: #6366f1; }
        .ev-chain-line { width: 2px; flex: 1; background: #e2e8f0; margin-top: 4px; }
        .ev-chain-content { flex: 1; background: #f8f9fa; border-radius: 6px; padding: 10px 12px; border-left: 3px solid #6366f1; }
        .ev-chain-claim { font-size: 12px; color: #1e293b; margin-bottom: 6px; }
        .ev-chain-meta { display: flex; gap: 8px; flex-wrap: wrap; font-size: 10px; }
        .ev-chain-badge { padding: 2px 6px; border-radius: 3px; background: #e2e8f0; color: #475569; }
        .ev-chain-badge.corroborated { background: #d1fae5; color: #065f46; }
        .ev-chain-sources { margin-top: 6px; font-size: 10px; color: #6b7280; }
    </style>
    <div class="ev-chain">
''')

        for i, item in enumerate(chain):
            corr_class = "corroborated" if item["corroborated"] else ""
            corr_text = "Corroborated" if item["corroborated"] else "Single Source"

            html_parts.append(f'''        <div class="ev-chain-item">
            <div class="ev-chain-connector">
                <div class="ev-chain-dot"></div>
                {'<div class="ev-chain-line"></div>' if i < len(chain) - 1 else ''}
            </div>
            <div class="ev-chain-content">
                <div class="ev-chain-claim">{html_mod.escape(item["claim"])}</div>
                <div class="ev-chain-meta">
                    <span class="ev-chain-badge">{item["evidence_type"].upper()}</span>
                    <span class="ev-chain-badge {corr_class}">{corr_text}</span>
                    <span class="ev-chain-badge">{int(item["confidence"]*100)}% conf</span>
                </div>
                <div class="ev-chain-sources">Sources: {", ".join([html_mod.escape(s) for s in item["sources"]])}</div>
            </div>
        </div>\n''')

        html_parts.append('    </div>\n</div>')
        return ''.join(html_parts)

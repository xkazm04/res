"""Gemini client with Google Search grounding."""

import json
import logging
from enum import Enum
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# Import Google's genai SDK
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    genai = None
    types = None


class SearchMode(Enum):
    """Search mode for research queries."""
    NONE = "none"
    SEARCH = "search"
    GROUNDED = "grounded"


@dataclass
class GroundingChunk:
    """A grounding source chunk."""
    uri: str
    title: str
    domain: str = ""

    def __post_init__(self):
        if not self.domain and self.uri:
            # Extract domain from title or URI
            self.domain = self.title.replace(".com", "").replace(".org", "")


@dataclass
class GroundingSupport:
    """Grounding support - links text segment to source chunks."""
    text: str
    start_index: int
    end_index: int
    chunk_indices: List[int] = field(default_factory=list)


@dataclass
class GroundingMetadata:
    """Full grounding metadata from response."""
    web_search_queries: List[str] = field(default_factory=list)
    grounding_chunks: List[GroundingChunk] = field(default_factory=list)
    grounding_supports: List[GroundingSupport] = field(default_factory=list)
    search_entry_point_html: Optional[str] = None


@dataclass
class TokenUsage:
    """Token usage from API response."""
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0

    def to_dict(self) -> Dict[str, int]:
        return {
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "total_tokens": self.total_tokens,
        }


@dataclass
class Source:
    """A source from grounded search."""
    url: str
    title: str
    domain: str
    snippet: str = ""
    source_type: str = "web"


@dataclass
class ResearchResponse:
    """Response from research query."""
    text: str
    sources: List[Source] = field(default_factory=list)
    search_queries: List[str] = field(default_factory=list)
    grounding_metadata: Optional[GroundingMetadata] = None
    token_usage: Optional[TokenUsage] = None
    cost_usd: Optional[float] = None
    search_mode: SearchMode = SearchMode.NONE
    model: str = ""
    raw_response: Optional[Any] = None
    parse_error: Optional[str] = None


class GeminiClient:
    """Gemini client with Google Search and Grounding."""

    DEFAULT_MODEL = "gemini-3-flash-preview"

    COST_RATES = {
        "gemini-3-flash-preview": {"input": 0.10, "output": 0.40},
        "gemini-2.5-flash-preview-05-20": {"input": 0.15, "output": 0.60},
        "gemini-2.0-flash": {"input": 0.075, "output": 0.30},
        "gemini-1.5-flash": {"input": 0.075, "output": 0.30},
        "gemini-1.5-pro": {"input": 1.25, "output": 5.00},
    }

    def __init__(
        self,
        api_key: str,
        model: Optional[str] = None,
        search_mode: SearchMode = SearchMode.GROUNDED,
    ):
        if not GENAI_AVAILABLE:
            raise ImportError(
                "google-genai package not installed. "
                "Install with: pip install google-genai"
            )

        self.api_key = api_key
        self.model = model or self.DEFAULT_MODEL
        self.search_mode = search_mode

        if not self.api_key:
            raise ValueError("Google API key required")

        self.client = genai.Client(api_key=self.api_key)

    def is_available(self) -> bool:
        return bool(self.api_key) and GENAI_AVAILABLE

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> ResearchResponse:
        """Generate response without web search."""
        full_prompt = self._build_prompt(prompt, system_prompt)

        config = types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
        )

        response = self.client.models.generate_content(
            model=self.model,
            contents=full_prompt,
            config=config,
        )

        token_usage = self._get_token_usage(response)
        return ResearchResponse(
            text=response.text,
            token_usage=token_usage,
            cost_usd=self._estimate_cost(token_usage),
            search_mode=SearchMode.NONE,
            model=self.model,
            raw_response=response,
        )

    async def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
    ) -> tuple[Any, ResearchResponse]:
        """Generate JSON response."""
        full_prompt = self._build_prompt(prompt, system_prompt)

        config = types.GenerateContentConfig(
            temperature=temperature,
            response_mime_type="application/json",
        )

        response = self.client.models.generate_content(
            model=self.model,
            contents=full_prompt,
            config=config,
        )

        parsed, parse_error = self._parse_json(response.text)

        token_usage = self._get_token_usage(response)
        res = ResearchResponse(
            text=response.text,
            token_usage=token_usage,
            cost_usd=self._estimate_cost(token_usage),
            search_mode=SearchMode.NONE,
            model=self.model,
            raw_response=response,
        )

        if parse_error:
            res.parse_error = parse_error

        return parsed, res

    async def research(
        self,
        query: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 4096,
        mode: Optional[SearchMode] = None,
    ) -> ResearchResponse:
        """Research query using Google Search."""
        search_mode = mode or self.search_mode

        if search_mode == SearchMode.NONE:
            return await self.generate(query, system_prompt, temperature, max_tokens)

        full_prompt = self._build_prompt(query, system_prompt)

        config = types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
            tools=[types.Tool(google_search=types.GoogleSearch())]
        )

        response = self.client.models.generate_content(
            model=self.model,
            contents=full_prompt,
            config=config,
        )

        grounding_meta = self._extract_grounding_metadata(response)
        sources = []
        search_queries = []

        if grounding_meta:
            search_queries = grounding_meta.web_search_queries
            sources = [
                Source(
                    url=chunk.uri,
                    title=chunk.title,
                    domain=chunk.domain,
                )
                for chunk in grounding_meta.grounding_chunks
            ]

        token_usage = self._get_token_usage(response)
        return ResearchResponse(
            text=response.text,
            sources=sources,
            search_queries=search_queries,
            grounding_metadata=grounding_meta if search_mode == SearchMode.GROUNDED else None,
            token_usage=token_usage,
            cost_usd=self._estimate_cost(token_usage),
            search_mode=search_mode,
            model=self.model,
            raw_response=response,
        )

    async def multi_search(
        self,
        queries: List[str],
        system_prompt: Optional[str] = None,
    ) -> List[ResearchResponse]:
        """Execute multiple research queries."""
        results = []
        for query in queries:
            try:
                response = await self.research(query, system_prompt=system_prompt)
                results.append(response)
            except Exception as e:
                logger.warning("Multi-search query failed: %s", e)
                results.append(ResearchResponse(
                    text=f"Error: {str(e)}",
                    search_mode=self.search_mode,
                    model=self.model,
                ))
        return results

    def _extract_grounding_metadata(self, response) -> Optional[GroundingMetadata]:
        """Extract full grounding metadata from response."""
        if not hasattr(response, 'candidates') or not response.candidates:
            return None

        candidate = response.candidates[0]
        if not hasattr(candidate, 'grounding_metadata'):
            return None

        meta = candidate.grounding_metadata
        if not meta:
            return None

        web_search_queries = []
        if hasattr(meta, 'web_search_queries') and meta.web_search_queries:
            web_search_queries = list(meta.web_search_queries)

        grounding_chunks = []
        if hasattr(meta, 'grounding_chunks') and meta.grounding_chunks:
            for chunk in meta.grounding_chunks:
                if hasattr(chunk, 'web') and chunk.web:
                    uri = getattr(chunk.web, 'uri', '') or ''
                    title = getattr(chunk.web, 'title', '') or ''
                    grounding_chunks.append(GroundingChunk(
                        uri=uri,
                        title=title,
                    ))

        grounding_supports = []
        if hasattr(meta, 'grounding_supports') and meta.grounding_supports:
            for support in meta.grounding_supports:
                segment = getattr(support, 'segment', None)
                if segment:
                    text = getattr(segment, 'text', '') or ''
                    start = getattr(segment, 'start_index', 0) or 0
                    end = getattr(segment, 'end_index', 0) or 0

                    chunk_indices = []
                    if hasattr(support, 'grounding_chunk_indices'):
                        chunk_indices = list(support.grounding_chunk_indices or [])

                    grounding_supports.append(GroundingSupport(
                        text=text,
                        start_index=start,
                        end_index=end,
                        chunk_indices=chunk_indices,
                    ))

        search_entry_point_html = None
        if hasattr(meta, 'search_entry_point'):
            sep = meta.search_entry_point
            if hasattr(sep, 'rendered_content'):
                search_entry_point_html = sep.rendered_content

        return GroundingMetadata(
            web_search_queries=web_search_queries,
            grounding_chunks=grounding_chunks,
            grounding_supports=grounding_supports,
            search_entry_point_html=search_entry_point_html,
        )

    def _build_prompt(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> str:
        if system_prompt:
            return f"{system_prompt}\n\n{prompt}"
        return prompt

    def _get_token_usage(self, response) -> Optional[TokenUsage]:
        """Extract token usage from response."""
        if not hasattr(response, 'usage_metadata') or not response.usage_metadata:
            return None

        usage = response.usage_metadata
        return TokenUsage(
            input_tokens=getattr(usage, 'prompt_token_count', 0) or 0,
            output_tokens=getattr(usage, 'candidates_token_count', 0) or 0,
            total_tokens=getattr(usage, 'total_token_count', 0) or 0,
        )

    def _estimate_cost(self, token_usage: Optional[TokenUsage]) -> Optional[float]:
        """Estimate cost based on token usage."""
        if not token_usage:
            return None

        rates = self.COST_RATES.get(
            self.model,
            {"input": 0.075, "output": 0.30}
        )

        input_cost = (token_usage.input_tokens / 1_000_000) * rates["input"]
        output_cost = (token_usage.output_tokens / 1_000_000) * rates["output"]

        return input_cost + output_cost

    def _parse_json(self, text: str) -> tuple[Any, Optional[str]]:
        """Parse JSON from text with fallback extraction."""
        if not text or not text.strip():
            return None, "Empty response text"

        try:
            return json.loads(text), None
        except json.JSONDecodeError as e:
            first_error = str(e)

            # Try extracting from code block
            import re
            code_block_match = re.search(r'```(?:json)?\s*\n?([\s\S]*?)\n?```', text)
            if code_block_match:
                try:
                    return json.loads(code_block_match.group(1)), None
                except json.JSONDecodeError:
                    pass

            # Try finding JSON array or object
            for start_char, end_char in [('[', ']'), ('{', '}')]:
                start = text.find(start_char)
                end = text.rfind(end_char) + 1
                if start != -1 and end > start:
                    try:
                        return json.loads(text[start:end]), None
                    except json.JSONDecodeError:
                        continue

            preview = text[:500] if len(text) > 500 else text
            error_msg = f"JSON parsing failed: {first_error}. Response preview: {preview}"
            logger.warning(error_msg)
            return None, error_msg

"""Cloud Run client for dispatching research to serverless backend."""

import logging
from typing import Dict, Any, Optional, List

import httpx

logger = logging.getLogger(__name__)


class CloudRunClient:
    """Client for calling the Cloud Run research service."""

    def __init__(
        self,
        service_url: str,
        timeout: int = 1200,  # 20 minutes for long research
        dispatch_timeout: int = 10,  # Short timeout for fire-and-forget dispatch
    ):
        """
        Initialize Cloud Run client.

        Args:
            service_url: Cloud Run service URL (e.g., https://deep-research-engine-xxx.run.app)
            timeout: Request timeout in seconds for synchronous calls
            dispatch_timeout: Short timeout for async dispatch acknowledgment
        """
        self.service_url = service_url.rstrip("/")
        self.timeout = timeout
        self.dispatch_timeout = dispatch_timeout
        self._client = httpx.AsyncClient(timeout=timeout)
        self._dispatch_client = httpx.AsyncClient(timeout=dispatch_timeout)

    async def health_check(self) -> bool:
        """Check if the Cloud Run service is healthy."""
        try:
            response = await self._client.get(f"{self.service_url}/health")
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"Cloud Run health check failed: {e}")
            return False

    async def execute_research(
        self,
        query: str,
        template: str = "investigative",
        granularity: str = "standard",
        max_searches: int = 5,
        perspectives: Optional[List[str]] = None,
        input_file_url: Optional[str] = None,
        input_text: Optional[str] = None,
        save_to_db: bool = True,
        workspace_id: str = "apify",
        use_cache: bool = True,
        extend_cache: bool = True,
        gemini_api_key: Optional[str] = None,
        supabase_url: Optional[str] = None,
        supabase_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Execute research via Cloud Run service.

        Args:
            query: Research query
            template: Research template type
            granularity: Research depth
            max_searches: Maximum number of searches
            perspectives: Optional list of perspectives to analyze
            input_file_url: URL to input file for context
            input_text: Direct text context
            save_to_db: Whether to save to Supabase
            workspace_id: Workspace identifier
            use_cache: Use cached results
            extend_cache: Extend cache in background
            gemini_api_key: API key for Gemini
            supabase_url: Supabase URL
            supabase_key: Supabase key

        Returns:
            Research result dictionary
        """
        payload = {
            "query": query,
            "template": template,
            "granularity": granularity,
            "max_searches": max_searches,
            "perspectives": perspectives,
            "input_file_url": input_file_url,
            "input_text": input_text,
            "save_to_db": save_to_db,
            "workspace_id": workspace_id,
            "use_cache": use_cache,
            "extend_cache": extend_cache,
            "gemini_api_key": gemini_api_key,
            "supabase_url": supabase_url,
            "supabase_key": supabase_key,
        }

        # Remove None values
        payload = {k: v for k, v in payload.items() if v is not None}

        logger.info(f"Dispatching research to Cloud Run: {query[:50]}...")

        try:
            response = await self._client.post(
                f"{self.service_url}/research",
                json=payload,
            )
            response.raise_for_status()
            result = response.json()
            logger.info(f"Cloud Run research completed: {result.get('session_id')}")
            return result

        except httpx.TimeoutException:
            logger.error("Cloud Run request timed out")
            raise RuntimeError("Research request timed out after 20 minutes")

        except httpx.HTTPStatusError as e:
            logger.error(f"Cloud Run HTTP error: {e.response.status_code} - {e.response.text}")
            raise RuntimeError(f"Cloud Run error: {e.response.text}")

        except Exception as e:
            logger.error(f"Cloud Run request failed: {e}")
            raise RuntimeError(f"Failed to execute research via Cloud Run: {str(e)}")

    async def generate_report(
        self,
        research_result: Dict[str, Any],
        title: Optional[str] = None,
        variant: str = "full_report",
        include_html: bool = True,
    ) -> Dict[str, str]:
        """
        Generate report via Cloud Run service.

        Args:
            research_result: Research result from execute_research
            title: Optional report title
            variant: Report variant
            include_html: Whether to include HTML version

        Returns:
            Dict with markdown and optional html keys
        """
        payload = {
            "research_result": research_result,
            "title": title,
            "variant": variant,
            "include_html": include_html,
        }

        try:
            response = await self._client.post(
                f"{self.service_url}/report",
                json=payload,
            )
            response.raise_for_status()
            return response.json()

        except Exception as e:
            logger.error(f"Cloud Run report generation failed: {e}")
            raise RuntimeError(f"Failed to generate report via Cloud Run: {str(e)}")

    async def dispatch_async(
        self,
        query: str,
        template: str = "investigative",
        granularity: str = "standard",
        max_searches: int = 5,
        perspectives: Optional[List[str]] = None,
        input_file_url: Optional[str] = None,
        input_text: Optional[str] = None,
        workspace_id: str = "apify",
        gemini_api_key: Optional[str] = None,
        supabase_url: Optional[str] = None,
        supabase_key: Optional[str] = None,
        resend_api_key: Optional[str] = None,
        # Report options
        generate_report: bool = True,
        report_format: str = "html",
        report_variant: str = "full_report",
        report_title: Optional[str] = None,
        # Email options
        send_email: bool = False,
        email_to: Optional[str] = None,
        email_subject: Optional[str] = None,
        # Callback for results
        callback_url: Optional[str] = None,
        # R2 storage options (for uploading final report)
        r2_job_id: Optional[str] = None,
        r2_account_id: Optional[str] = None,
        r2_access_key_id: Optional[str] = None,
        r2_secret_access_key: Optional[str] = None,
        r2_bucket_name: Optional[str] = None,
        r2_public_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Fire-and-forget dispatch to Cloud Run. Returns immediately after acknowledgment.

        Cloud Run handles everything: research, report generation, email delivery.
        Results are delivered via email and/or callback URL.

        Args:
            query: Research query
            template: Research template type
            granularity: Research depth
            max_searches: Maximum number of searches
            perspectives: Optional list of perspectives to analyze
            input_file_url: URL to input file for context
            input_text: Direct text context
            workspace_id: Workspace identifier
            gemini_api_key: API key for Gemini
            supabase_url: Supabase URL
            supabase_key: Supabase key
            resend_api_key: Resend API key for email
            generate_report: Whether to generate report
            report_format: Report format (html, markdown)
            report_variant: Report variant
            report_title: Custom report title
            send_email: Whether to send email
            email_to: Recipient email
            email_subject: Custom email subject
            callback_url: URL to POST results when complete

        Returns:
            Dict with job_id and status
        """
        payload = {
            "query": query,
            "template": template,
            "granularity": granularity,
            "max_searches": max_searches,
            "perspectives": perspectives,
            "input_file_url": input_file_url,
            "input_text": input_text,
            "workspace_id": workspace_id,
            "gemini_api_key": gemini_api_key,
            "supabase_url": supabase_url,
            "supabase_key": supabase_key,
            "resend_api_key": resend_api_key,
            # Report
            "generate_report": generate_report,
            "report_format": report_format,
            "report_variant": report_variant,
            "report_title": report_title,
            # Email
            "send_email": send_email,
            "email_to": email_to,
            "email_subject": email_subject,
            # Callback
            "callback_url": callback_url,
            # R2 storage (Cloud Run uploads final report here)
            "r2_job_id": r2_job_id,
            "r2_account_id": r2_account_id,
            "r2_access_key_id": r2_access_key_id,
            "r2_secret_access_key": r2_secret_access_key,
            "r2_bucket_name": r2_bucket_name,
            "r2_public_url": r2_public_url,
            # Always extend cache in background
            "use_cache": True,
            "extend_cache": True,
            "save_to_db": True,
            # Signal async mode
            "async_mode": True,
        }

        # Remove None values
        payload = {k: v for k, v in payload.items() if v is not None}

        logger.info(f"Dispatching async research to Cloud Run: {query[:50]}...")

        try:
            response = await self._dispatch_client.post(
                f"{self.service_url}/research/async",
                json=payload,
            )
            response.raise_for_status()
            result = response.json()
            logger.info(f"Cloud Run acknowledged job: {result.get('job_id')}")
            return result

        except httpx.TimeoutException:
            # Even on timeout, Cloud Run may have received the request
            logger.warning("Cloud Run dispatch timeout - job may still be processing")
            return {
                "status": "dispatched",
                "job_id": "unknown",
                "message": "Request dispatched but acknowledgment timed out",
            }

        except Exception as e:
            logger.error(f"Cloud Run async dispatch failed: {e}")
            raise RuntimeError(f"Failed to dispatch research to Cloud Run: {str(e)}")

    async def close(self):
        """Close the HTTP clients."""
        await self._client.aclose()
        await self._dispatch_client.aclose()

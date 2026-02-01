"""Cloudflare R2 client for report storage with pre-generated URLs."""

import logging
from typing import Optional
from datetime import datetime
import hashlib

import boto3
from botocore.config import Config

logger = logging.getLogger(__name__)


class R2Client:
    """Client for Cloudflare R2 storage (S3-compatible)."""

    def __init__(
        self,
        account_id: str,
        access_key_id: str,
        secret_access_key: str,
        bucket_name: str,
        public_url_base: Optional[str] = None,
    ):
        """
        Initialize R2 client.

        Args:
            account_id: Cloudflare account ID
            access_key_id: R2 access key ID
            secret_access_key: R2 secret access key
            bucket_name: R2 bucket name
            public_url_base: Base URL for public access (e.g., https://reports.example.com)
                            If not provided, uses r2.dev URL
        """
        self.account_id = account_id
        self.bucket_name = bucket_name
        self.public_url_base = public_url_base

        # R2 endpoint
        endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"

        # Create S3 client configured for R2
        self._client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            config=Config(
                signature_version="s3v4",
                retries={"max_attempts": 3, "mode": "adaptive"},
            ),
            region_name="auto",
        )

        logger.info(f"R2 client initialized for bucket: {bucket_name}")

    def generate_job_id(self, query: str, template: str) -> str:
        """Generate a unique job ID based on query and timestamp."""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        query_hash = hashlib.sha256(query.encode()).hexdigest()[:8]
        return f"res_{timestamp}_{query_hash}"

    def get_report_key(self, job_id: str) -> str:
        """Get the S3 key for a report."""
        return f"reports/{job_id}/report.html"

    def get_public_url(self, job_id: str) -> str:
        """Get the public URL for a report."""
        key = self.get_report_key(job_id)
        if self.public_url_base:
            return f"{self.public_url_base.rstrip('/')}/{key}"
        return f"https://pub-{self.account_id}.r2.dev/{key}"

    def upload_report(
        self,
        job_id: str,
        html_content: str,
        query: str = "",
        template: str = "",
        cache_max_age: int = 86400,
    ) -> str:
        """
        Upload the final report HTML.

        Args:
            job_id: Unique job identifier
            html_content: Final HTML report content
            query: Research query (for logging)
            template: Template type (for logging)
            cache_max_age: Cache duration in seconds

        Returns:
            Public URL to the report
        """
        key = self.get_report_key(job_id)
        try:
            self._client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=html_content.encode("utf-8"),
                ContentType="text/html; charset=utf-8",
                CacheControl=f"public, max-age={cache_max_age}",
            )
            logger.info(f"Uploaded final report to R2: {key}")
        except Exception as e:
            logger.error(f"Failed to upload report to R2: {e}")
            raise

        return self.get_public_url(job_id)

    def upload_markdown(
        self,
        job_id: str,
        markdown_content: str,
    ) -> str:
        """Upload markdown version of the report."""
        key = f"reports/{job_id}/report.md"
        try:
            self._client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=markdown_content.encode("utf-8"),
                ContentType="text/markdown; charset=utf-8",
                CacheControl="public, max-age=86400",
            )
            logger.info(f"Uploaded markdown to R2: {key}")
        except Exception as e:
            logger.error(f"Failed to upload markdown to R2: {e}")
            raise

        if self.public_url_base:
            return f"{self.public_url_base.rstrip('/')}/{key}"
        return f"https://pub-{self.account_id}.r2.dev/{key}"

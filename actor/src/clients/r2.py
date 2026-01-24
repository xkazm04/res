"""Cloudflare R2 client for report storage with pre-generated URLs."""

import logging
from typing import Optional
from datetime import datetime
import hashlib

import boto3
from botocore.config import Config

logger = logging.getLogger(__name__)


# Placeholder HTML template with auto-refresh
PLACEHOLDER_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="refresh" content="15">
    <title>Research in Progress - {query_short}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #e2e8f0;
        }}
        .container {{
            text-align: center;
            padding: 3rem;
            max-width: 600px;
        }}
        .spinner {{
            width: 60px;
            height: 60px;
            border: 4px solid rgba(59, 130, 246, 0.2);
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 2rem;
        }}
        @keyframes spin {{
            to {{ transform: rotate(360deg); }}
        }}
        h1 {{
            font-size: 1.75rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #f8fafc;
        }}
        .query {{
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 8px;
            padding: 1rem;
            margin: 1.5rem 0;
            font-style: italic;
            color: #94a3b8;
        }}
        .info {{
            color: #64748b;
            font-size: 0.9rem;
            margin-top: 1.5rem;
        }}
        .template-badge {{
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.8rem;
            font-weight: 500;
            margin-bottom: 1rem;
        }}
        .time {{
            font-size: 0.85rem;
            color: #475569;
            margin-top: 2rem;
        }}
        .progress-bar {{
            width: 100%;
            height: 4px;
            background: rgba(59, 130, 246, 0.2);
            border-radius: 2px;
            margin-top: 2rem;
            overflow: hidden;
        }}
        .progress-bar-inner {{
            height: 100%;
            background: #3b82f6;
            animation: progress 3s ease-in-out infinite;
        }}
        @keyframes progress {{
            0% {{ width: 0%; }}
            50% {{ width: 70%; }}
            100% {{ width: 100%; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <span class="template-badge">{template}</span>
        <h1>Your research is being generated</h1>
        <div class="query">"{query}"</div>
        <p>Our AI is searching the web, analyzing sources, and compiling expert perspectives.</p>
        <p class="info">This page refreshes automatically every 15 seconds.</p>
        <div class="progress-bar">
            <div class="progress-bar-inner"></div>
        </div>
        <p class="time">Started at {started_at} UTC</p>
    </div>
</body>
</html>"""


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
            region_name="auto",  # R2 uses 'auto' region
        )

        logger.info(f"R2 client initialized for bucket: {bucket_name}")

    def generate_job_id(self, query: str, template: str) -> str:
        """Generate a unique job ID based on query and timestamp."""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        # Create short hash of query for uniqueness
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
        # Default r2.dev URL (requires public bucket)
        return f"https://pub-{self.account_id}.r2.dev/{key}"

    def upload_placeholder(
        self,
        job_id: str,
        query: str,
        template: str,
    ) -> str:
        """
        Upload a placeholder HTML page that auto-refreshes.

        Args:
            job_id: Unique job identifier
            query: Research query
            template: Research template type

        Returns:
            Public URL to the placeholder page
        """
        # Truncate query for display
        query_short = query[:50] + "..." if len(query) > 50 else query
        started_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

        # Format placeholder HTML
        html_content = PLACEHOLDER_HTML.format(
            query=query,
            query_short=query_short,
            template=template.replace("_", " ").title(),
            started_at=started_at,
        )

        # Upload to R2
        key = self.get_report_key(job_id)
        try:
            self._client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=html_content.encode("utf-8"),
                ContentType="text/html; charset=utf-8",
                CacheControl="no-cache, no-store, must-revalidate",
            )
            logger.info(f"Uploaded placeholder to R2: {key}")
        except Exception as e:
            logger.error(f"Failed to upload placeholder to R2: {e}")
            raise

        return self.get_public_url(job_id)

    def upload_report(
        self,
        job_id: str,
        html_content: str,
        cache_max_age: int = 86400,  # 24 hours
    ) -> str:
        """
        Upload the final report HTML, replacing the placeholder.

        Args:
            job_id: Unique job identifier
            html_content: Final HTML report content
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
        """
        Upload markdown version of the report.

        Args:
            job_id: Unique job identifier
            markdown_content: Markdown report content

        Returns:
            Public URL to the markdown file
        """
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

    def delete_report(self, job_id: str) -> bool:
        """Delete a report and its assets."""
        prefix = f"reports/{job_id}/"
        try:
            # List all objects with prefix
            response = self._client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix,
            )

            if "Contents" in response:
                for obj in response["Contents"]:
                    self._client.delete_object(
                        Bucket=self.bucket_name,
                        Key=obj["Key"],
                    )
                logger.info(f"Deleted report from R2: {prefix}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete report from R2: {e}")
            return False

    def check_report_exists(self, job_id: str) -> bool:
        """Check if a report exists."""
        key = self.get_report_key(job_id)
        try:
            self._client.head_object(Bucket=self.bucket_name, Key=key)
            return True
        except:
            return False

"""Configuration settings from environment variables."""

import os
from typing import Optional
from pydantic import BaseModel
from functools import lru_cache


class Settings(BaseModel):
    """Application settings loaded from environment."""

    # Google Gemini
    google_api_key: str = ""
    gemini_model: str = "gemini-3-flash-preview"

    # OpenRouter for OCR
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_ocr_model: str = "google/gemini-2.5-flash-preview"

    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""

    # Resend for email delivery
    resend_api_key: str = ""

    # Langsmith for monitoring
    langsmith_api_key: str = ""
    langsmith_project: str = "deep-research-actor"
    langsmith_enabled: bool = True

    # Cloud Run for cost optimization
    cloud_run_url: str = ""

    # Cloudflare R2 for report storage
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = "deep-research-reports"
    r2_public_url: str = ""  # Custom domain or leave empty for r2.dev

    # Cost rates per 1M tokens
    gemini_input_rate: float = 0.15
    gemini_output_rate: float = 0.60
    openrouter_rate: float = 0.50

    class Config:
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings(
        google_api_key=os.getenv("GOOGLE_API_KEY", "") or os.getenv("GEMINI_API_KEY", ""),
        gemini_model=os.getenv("GEMINI_MODEL", "gemini-3-flash-preview"),
        openrouter_api_key=os.getenv("OPENROUTER_API_KEY", ""),
        openrouter_base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
        openrouter_ocr_model=os.getenv("OPENROUTER_OCR_MODEL", "google/gemini-2.5-flash-preview"),
        supabase_url=os.getenv("SUPABASE_URL", "") or os.getenv("NEXT_PUBLIC_SUPABASE_URL", ""),
        supabase_key=os.getenv("SUPABASE_KEY", "") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""),
        langsmith_api_key=os.getenv("LANGSMITH_API_KEY", "") or os.getenv("LANGCHAIN_API_KEY", ""),
        langsmith_project=os.getenv("LANGSMITH_PROJECT", "deep-research-actor"),
        resend_api_key=os.getenv("RESEND_API_KEY", ""),
        langsmith_enabled=os.getenv("LANGSMITH_ENABLED", "true").lower() == "true",
        cloud_run_url=os.getenv("CLOUD_RUN_URL", ""),
        # Cloudflare R2
        r2_account_id=os.getenv("R2_ACCOUNT_ID", ""),
        r2_access_key_id=os.getenv("R2_ACCESS_KEY_ID", ""),
        r2_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY", ""),
        r2_bucket_name=os.getenv("R2_BUCKET_NAME", "deep-research-reports"),
        r2_public_url=os.getenv("R2_PUBLIC_URL", ""),
    )


def override_settings(
    google_api_key: Optional[str] = None,
    openrouter_api_key: Optional[str] = None,
    supabase_url: Optional[str] = None,
    supabase_key: Optional[str] = None,
    resend_api_key: Optional[str] = None,
    cloud_run_url: Optional[str] = None,
) -> Settings:
    """Create settings with optional overrides from actor input."""
    base = get_settings()
    return Settings(
        google_api_key=google_api_key or base.google_api_key,
        gemini_model=base.gemini_model,
        openrouter_api_key=openrouter_api_key or base.openrouter_api_key,
        openrouter_base_url=base.openrouter_base_url,
        openrouter_ocr_model=base.openrouter_ocr_model,
        supabase_url=supabase_url or base.supabase_url,
        supabase_key=supabase_key or base.supabase_key,
        resend_api_key=resend_api_key or base.resend_api_key,
        langsmith_api_key=base.langsmith_api_key,
        langsmith_project=base.langsmith_project,
        langsmith_enabled=base.langsmith_enabled,
        cloud_run_url=cloud_run_url or base.cloud_run_url,
    )

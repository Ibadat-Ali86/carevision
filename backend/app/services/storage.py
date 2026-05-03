from __future__ import annotations

import logging
import uuid

from app.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    """Cloudflare R2 (S3-compatible) upload client.

    DESIGN DECISIONS:
    - Lazy boto3 client init: the boto3 import and client creation are deferred
      until the first upload call. This prevents startup failure when R2 env
      vars are not set (development mode).
    - is_configured() check: allows routes/analyze.py to gate uploads without
      attempting the connection, preventing confusing error messages.
    - Storage failure is non-fatal: the clinical response is always returned.
      The caller (routes/analyze.py) is responsible for the try/except pattern.
    """

    def __init__(self) -> None:
        self._client: object | None = None

    def is_configured(self) -> bool:
        """Return True only when all required R2 environment variables are set."""
        return bool(
            settings.r2_account_id
            and settings.r2_access_key
            and settings.r2_secret_key
            and settings.r2_bucket
        )

    def _get_client(self) -> object:
        """Lazy-initialize the boto3 S3 client on first use."""
        if self._client is None:
            import boto3

            self._client = boto3.client(
                "s3",
                endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
                aws_access_key_id=settings.r2_access_key,
                aws_secret_access_key=settings.r2_secret_key,
                region_name="auto",
            )
        return self._client

    def upload_image(self, image_b64: str, analysis_type: str) -> str | None:
        """Upload a compressed base64 JPEG to Cloudflare R2.

        Object key format: YYYY/MM/DD/{analysis_type}/{uuid}.jpg
        This format enables date-based lifecycle policies and query patterns.

        Args:
            image_b64: Compressed base64 JPEG string
            analysis_type: Used in the object key path

        Returns:
            Public URL string if R2_PUBLIC_URL is configured, otherwise None.
            Returns None on any error (storage failure is non-fatal).
        """
        import base64
        import datetime

        if not self.is_configured():
            return None

        try:
            client = self._get_client()
            date_prefix = datetime.date.today().strftime("%Y/%m/%d")
            object_key = f"{date_prefix}/{analysis_type}/{uuid.uuid4()}.jpg"
            image_bytes = base64.b64decode(image_b64)

            client.put_object(  # type: ignore[union-attr]
                Bucket=settings.r2_bucket,
                Key=object_key,
                Body=image_bytes,
                ContentType="image/jpeg",
            )

            if settings.r2_public_url:
                return f"{settings.r2_public_url.rstrip('/')}/{object_key}"
            return None

        except Exception as exc:
            logger.warning("R2 upload failed (non-fatal): %s", exc)
            return None


# Module-level singleton — never instantiate StorageService() inside a route handler.
storage_service = StorageService()

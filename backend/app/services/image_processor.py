from __future__ import annotations

import base64
import io
import logging

from PIL import Image

logger = logging.getLogger(__name__)

# Hard limits from Section 4.7 of the PRD
MAX_DIMENSION_PX: int = 1024
MAX_OUTPUT_BYTES: int = 1_000_000  # 1MB to Gemma 4
INITIAL_JPEG_QUALITY: int = 85
MIN_JPEG_QUALITY: int = 50
QUALITY_REDUCTION_STEP: int = 10


def validate_and_compress(image_b64: str) -> str:
    """Validate and compress a base64 JPEG image for Gemma 4 consumption.

    Processing pipeline:
    1. base64 decode — raises ValueError on invalid base64
    2. Pillow verify — validates image format integrity
    3. RGB conversion — handles CMYK, PNG-with-alpha, and other color spaces
    4. Resize to MAX_DIMENSION_PX on longest edge (LANCZOS for quality)
    5. JPEG compression at quality=85
    6. Iterative quality reduction to MIN_JPEG_QUALITY if still above 1MB

    Args:
        image_b64: Pure base64 string (no data: URI prefix)

    Returns:
        Compressed base64 JPEG string ready for Gemma 4

    Raises:
        ValueError: If base64 is invalid or image cannot be opened/verified
    """
    # Step 1: Decode base64
    try:
        image_bytes = base64.b64decode(image_b64)
    except Exception as exc:
        raise ValueError("Invalid base64 image data.") from exc

    # Step 2 + 3: Open, verify, and convert color space
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.verify()
        # Re-open after verify() — verify() exhausts the internal stream
        img = Image.open(io.BytesIO(image_bytes))
        img = img.convert("RGB")
    except Exception as exc:
        raise ValueError(f"Cannot open or parse image: {exc}") from exc

    # Step 4: Resize to max dimension (preserves aspect ratio)
    width, height = img.size
    if max(width, height) > MAX_DIMENSION_PX:
        if width >= height:
            new_width = MAX_DIMENSION_PX
            new_height = int(height * MAX_DIMENSION_PX / width)
        else:
            new_height = MAX_DIMENSION_PX
            new_width = int(width * MAX_DIMENSION_PX / height)
        img = img.resize((new_width, new_height), Image.LANCZOS)

    # Step 5 + 6: Compress to JPEG, iteratively reduce quality if above 1MB
    quality = INITIAL_JPEG_QUALITY
    output_buffer = io.BytesIO()

    while quality >= MIN_JPEG_QUALITY:
        output_buffer.seek(0)
        output_buffer.truncate()
        img.save(output_buffer, format="JPEG", quality=quality, optimize=True)
        if output_buffer.tell() <= MAX_OUTPUT_BYTES:
            break
        quality -= QUALITY_REDUCTION_STEP
        logger.warning(
            "Image above 1MB at quality=%d, reducing to quality=%d",
            quality + QUALITY_REDUCTION_STEP,
            quality,
        )

    compressed_bytes = output_buffer.getvalue()
    return base64.b64encode(compressed_bytes).decode("utf-8")

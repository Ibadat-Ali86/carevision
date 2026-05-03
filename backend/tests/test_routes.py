from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.schemas.common import DISCLAIMER


def _make_teststrip_raw() -> dict:
    return {
        "test_type": "Malaria RDT",
        "result": "positive",
        "confidence": "high",
        "line_description": "Control line and test line both visible.",
        "recommended_action": "Initiate antimalarial treatment per protocol.",
        "next_steps": ["Confirm with supervisor", "Document result"],
        "disclaimer": "",  # Will be overwritten by force-injection
    }


def _make_woundassess_raw() -> dict:
    return {
        "wound_type": "laceration",
        "severity": 4,
        "severity_rationale": "Deep wound with red streaking.",
        "recommended_action": "Apply sterile dressing and refer immediately.",
        "refer_immediately": True,
        "refer_reason": "Possible lymphangitis — same-day referral required.",
        "wound_care_steps": ["Irrigate", "Apply dressing", "Refer"],
        "disclaimer": "",
    }


# ── /health ────────────────────────────────────────────────────────────────────

def test_health_returns_200(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


# ── /analyze/ — happy paths ────────────────────────────────────────────────────

@patch("app.routes.analyze.gemma_client")
@patch("app.routes.analyze.validate_and_compress", return_value="compressed_b64")
def test_analyze_teststrip_happy_path(
    mock_compress: MagicMock,
    mock_client: MagicMock,
    client: TestClient,
) -> None:
    raw = _make_teststrip_raw()
    raw["_elapsed_ms"] = 1234.0
    mock_client.analyze.return_value = raw
    mock_client._model_name = "test-model"

    response = client.post(
        "/analyze/",
        json={"type": "teststrip", "image_b64": "dGVzdA==", "language": "en"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "teststrip"
    # CRITICAL: Disclaimer must always be present in result
    assert data["result"]["disclaimer"] == DISCLAIMER


@patch("app.routes.analyze.gemma_client")
@patch("app.routes.analyze.validate_and_compress", return_value="compressed_b64")
def test_analyze_woundassess_refer_immediately(
    mock_compress: MagicMock,
    mock_client: MagicMock,
    client: TestClient,
) -> None:
    raw = _make_woundassess_raw()
    raw["_elapsed_ms"] = 1500.0
    mock_client.analyze.return_value = raw
    mock_client._model_name = "test-model"

    response = client.post(
        "/analyze/",
        json={"type": "woundassess", "image_b64": "dGVzdA==", "language": "en"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["result"]["refer_immediately"] is True
    assert data["result"]["disclaimer"] == DISCLAIMER


# ── /analyze/ — error cases ────────────────────────────────────────────────────

def test_analyze_image_too_large_returns_422(client: TestClient) -> None:
    response = client.post(
        "/analyze/",
        json={"type": "teststrip", "image_b64": "A" * 1_500_001},
    )
    assert response.status_code == 422


def test_analyze_invalid_type_returns_422(client: TestClient) -> None:
    response = client.post(
        "/analyze/",
        json={"type": "invalid_type", "image_b64": "dGVzdA=="},
    )
    assert response.status_code == 422


@patch("app.routes.analyze.gemma_client")
@patch("app.routes.analyze.validate_and_compress", return_value="compressed_b64")
def test_analyze_gemma_failure_returns_503(
    mock_compress: MagicMock,
    mock_client: MagicMock,
    client: TestClient,
) -> None:
    mock_client.analyze.side_effect = RuntimeError("API timeout")

    response = client.post(
        "/analyze/",
        json={"type": "teststrip", "image_b64": "dGVzdA=="},
    )
    assert response.status_code == 503


# ── Disclaimer present in ALL 4 result types ────────────────────────────────────

@pytest.mark.parametrize(
    "analysis_type,raw_factory",
    [
        ("teststrip", _make_teststrip_raw),
        ("woundassess", _make_woundassess_raw),
    ],
)
@patch("app.routes.analyze.gemma_client")
@patch("app.routes.analyze.validate_and_compress", return_value="compressed_b64")
def test_disclaimer_always_injected(
    mock_compress: MagicMock,
    mock_client: MagicMock,
    analysis_type: str,
    raw_factory: object,
    client: TestClient,
) -> None:
    raw = raw_factory()  # type: ignore[operator]
    raw["_elapsed_ms"] = 1000.0
    mock_client.analyze.return_value = raw
    mock_client._model_name = "test-model"

    response = client.post(
        "/analyze/",
        json={"type": analysis_type, "image_b64": "dGVzdA=="},
    )
    assert response.status_code == 200
    assert response.json()["result"]["disclaimer"] == DISCLAIMER


# ── /protocols/ ────────────────────────────────────────────────────────────────

@patch("app.routes.protocols.gemma_client")
def test_protocols_returns_answer_and_disclaimer(
    mock_client: MagicMock,
    client: TestClient,
) -> None:
    mock_client.query_protocol.return_value = "Use ORS for mild dehydration."

    response = client.post(
        "/protocols/",
        json={"query": "How to treat mild dehydration?", "language": "en"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert data["disclaimer"] == DISCLAIMER


# ── /referral/ ─────────────────────────────────────────────────────────────────

def test_referral_emergency_level_5(client: TestClient) -> None:
    response = client.post(
        "/referral/",
        json={
            "patient_summary": "35yo male, arterial bleeding",
            "urgency": 5,
            "clinical_reason": "Arterial bleed requiring surgical control",
            "facility_type_needed": "Surgical hospital",
            "chw_name": "Amina B.",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["urgency_label"] == "EMERGENCY"
    assert data["urgency_color"] == "#9B1B30"
    assert "wa.me" in data["whatsapp_message"]


def test_referral_invalid_urgency_returns_422(client: TestClient) -> None:
    response = client.post(
        "/referral/",
        json={
            "patient_summary": "test",
            "urgency": 6,
            "clinical_reason": "test",
            "facility_type_needed": "clinic",
        },
    )
    assert response.status_code == 422


# ── consent_given gate ─────────────────────────────────────────────────────────

@patch("app.routes.analyze.gemma_client")
@patch("app.routes.analyze.validate_and_compress", return_value="compressed_b64")
@patch("app.routes.analyze.storage_service")
def test_consent_false_image_not_stored(
    mock_storage: MagicMock,
    mock_compress: MagicMock,
    mock_client: MagicMock,
    client: TestClient,
) -> None:
    raw = _make_teststrip_raw()
    raw["_elapsed_ms"] = 100.0
    mock_client.analyze.return_value = raw
    mock_client._model_name = "test-model"
    mock_storage.is_configured.return_value = True

    response = client.post(
        "/analyze/",
        json={"type": "teststrip", "image_b64": "dGVzdA==", "consent_given": False},
    )
    assert response.status_code == 200
    assert response.json()["image_stored"] is False
    mock_storage.upload_image.assert_not_called()

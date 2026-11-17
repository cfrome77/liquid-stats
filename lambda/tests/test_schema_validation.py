"""Tests for the schema validation added to the Untappd data pipeline.

The committed fixtures in ``src/assets/data`` are the same files the app ships
with, so validating them here proves the schemas accept the real payload shapes.
The negative cases prove a partial or changed API response is rejected before
anything is written.
"""

import copy
import json

import pytest

from conftest import load_fixture


def _stub_credentials(monkeypatch, module):
    """The module reads its config at import time; patch it for handler tests."""
    monkeypatch.setattr(module, "CLIENT_ID", "test-id")
    monkeypatch.setattr(module, "CLIENT_SECRET", "test-secret")
    monkeypatch.setattr(module, "UNTAPPD_USERNAME", "test-user")
    monkeypatch.setattr(module, "S3_BUCKET_NAME", None)


@pytest.fixture
def beers_payload():
    return load_fixture("beers_all.json")


@pytest.fixture
def checkins_payload():
    return load_fixture("checkins.json")


@pytest.fixture
def badges_payload():
    return load_fixture("badges.json")


@pytest.fixture
def wishlist_payload():
    return load_fixture("wishlist.json")


def test_real_fixtures_pass_validation(
    fetch_api_data,
    beers_payload,
    checkins_payload,
    badges_payload,
    wishlist_payload,
):
    module = fetch_api_data
    module.validate_payload(module.BeersAllFile, beers_payload, "beers_all.json")
    module.validate_payload(module.BadgesFile, badges_payload, "badges.json")
    module.validate_payload(module.CheckinsFile, checkins_payload, "checkins.json")
    module.validate_payload(module.WishlistFile, wishlist_payload, "wishlist.json")


def test_stats_output_passes_validation(fetch_api_data, beers_payload):
    module = fetch_api_data
    stats = module.compute_stats(beers_payload["beers"])
    module.validate_payload(module.StatsFile, stats, "stats.json")


def test_missing_required_beer_field_aborts(fetch_api_data, beers_payload):
    module = fetch_api_data
    broken = copy.deepcopy(beers_payload)
    # The stats service reads beer_style without guarding; dropping it must fail.
    del broken["beers"][0]["beer"]["beer_style"]

    with pytest.raises(module.ValidationAbort) as exc:
        module.validate_payload(module.BeersAllFile, broken, "beers_all.json")

    message = str(exc.value)
    assert "beers_all.json" in message
    assert "beer_style" in message


def test_wrong_type_in_beers_aborts(fetch_api_data, beers_payload):
    module = fetch_api_data
    broken = copy.deepcopy(beers_payload)
    broken["beers"][0]["rating_score"] = "not-a-number"

    with pytest.raises(module.ValidationAbort) as exc:
        module.validate_payload(module.BeersAllFile, broken, "beers_all.json")

    assert "rating_score" in str(exc.value)


def test_empty_required_string_aborts(fetch_api_data, checkins_payload):
    module = fetch_api_data
    broken = copy.deepcopy(checkins_payload)
    # A blank beer name renders as an empty card title.
    broken["response"]["checkins"]["items"][0]["beer"]["beer_name"] = "   "

    with pytest.raises(module.ValidationAbort) as exc:
        module.validate_payload(module.CheckinsFile, broken, "checkins.json")

    assert "beer_name" in str(exc.value)


def test_truncated_checkins_response_aborts(fetch_api_data, checkins_payload):
    module = fetch_api_data
    # Simulate a partial payload where the API drops the nested items array.
    broken = {"response": {"checkins": {}}}

    with pytest.raises(module.ValidationAbort) as exc:
        module.validate_payload(module.CheckinsFile, broken, "checkins.json")

    assert "items" in str(exc.value)


def test_checkin_without_optional_fields_still_passes(fetch_api_data):
    module = fetch_api_data
    # Untappd omits comment/badges/media/venue and some brewery locations.
    payload = {
        "response": {
            "checkins": {
                "items": [
                    {
                        "checkin_id": 1,
                        "created_at": "Mon, 06 Apr 2026 21:00:00 +0000",
                        "rating_score": 0,
                        "beer": {
                            "bid": 10,
                            "beer_name": "Bare Beer",
                            "beer_style": "Lager",
                        },
                        "brewery": {
                            "brewery_id": 20,
                            "brewery_name": "Bare Brewery",
                            "country_name": "USA",
                        },
                    }
                ]
            }
        }
    }

    module.validate_payload(module.CheckinsFile, payload, "checkins.json")


def test_badges_must_be_a_list(fetch_api_data):
    module = fetch_api_data
    with pytest.raises(module.ValidationAbort):
        module.validate_payload(module.BadgesFile, {"badges": []}, "badges.json")


def test_unknown_fields_are_preserved(fetch_api_data, beers_payload):
    module = fetch_api_data
    # extra="allow" keeps new upstream fields instead of dropping them.
    payload = copy.deepcopy(beers_payload)
    payload["beers"][0]["new_upstream_field"] = "value"

    model = module.validate_payload(module.BeersAllFile, payload, "beers_all.json")

    assert model.beers[0].new_upstream_field == "value"


def test_lambda_handler_aborts_before_writing_on_invalid_data(
    fetch_api_data, monkeypatch, beers_payload
):
    module = fetch_api_data

    written = []

    def fake_save_json(filename, data):
        written.append(filename)

    broken_beers = copy.deepcopy(beers_payload)
    del broken_beers["beers"][0]["beer"]["bid"]

    _stub_credentials(monkeypatch, module)
    monkeypatch.setattr(module, "get_all_beers", lambda: broken_beers["beers"])
    monkeypatch.setattr(module, "save_json", fake_save_json)

    result = module.lambda_handler(None, None)

    assert result["statusCode"] == 500
    assert "Validation failed" in result["body"]
    # No file may be written once validation fails.
    assert written == []


def test_lambda_handler_writes_all_files_when_valid(
    fetch_api_data, monkeypatch, beers_payload, checkins_payload, badges_payload,
    wishlist_payload,
):
    module = fetch_api_data

    written = {}

    def fake_save_json(filename, data):
        written[filename] = data

    _stub_credentials(monkeypatch, module)
    monkeypatch.setattr(module, "get_all_beers", lambda: beers_payload["beers"])
    monkeypatch.setattr(module, "get_all_badges", lambda: badges_payload)
    monkeypatch.setattr(module, "get_checkins", lambda: checkins_payload)
    monkeypatch.setattr(module, "get_wishlist", lambda: wishlist_payload)
    monkeypatch.setattr(module, "save_json", fake_save_json)

    result = module.lambda_handler(None, None)

    assert result["statusCode"] == 200
    assert set(written) == {
        "beers_all.json",
        "badges.json",
        "checkins.json",
        "wishlist.json",
        "stats.json",
    }
    # The validated payload is written unchanged, preserving upstream fields.
    assert written["beers_all.json"] == beers_payload


class _FakeS3:
    def __init__(self):
        self.uploads = []

    def put_object(self, **kwargs):
        self.uploads.append(kwargs)


def test_lambda_handler_uploads_all_files_to_s3_when_valid(
    fetch_api_data, monkeypatch, beers_payload, checkins_payload, badges_payload,
    wishlist_payload,
):
    """The production path: with a bucket configured, every payload reaches S3."""
    module = fetch_api_data
    fake_s3 = _FakeS3()

    _stub_credentials(monkeypatch, module)
    monkeypatch.setattr(module, "s3", fake_s3)
    monkeypatch.setattr(module, "S3_BUCKET_NAME", "prod-bucket")
    monkeypatch.setattr(module, "get_all_beers", lambda: beers_payload["beers"])
    monkeypatch.setattr(module, "get_all_badges", lambda: badges_payload)
    monkeypatch.setattr(module, "get_checkins", lambda: checkins_payload)
    monkeypatch.setattr(module, "get_wishlist", lambda: wishlist_payload)

    result = module.lambda_handler(None, None)

    assert result["statusCode"] == 200
    assert {u["Key"] for u in fake_s3.uploads} == {
        "beers_all.json",
        "badges.json",
        "checkins.json",
        "wishlist.json",
        "stats.json",
    }
    assert all(u["Bucket"] == "prod-bucket" for u in fake_s3.uploads)
    assert all(u["ContentType"] == "application/json" for u in fake_s3.uploads)
    # Uploaded bodies are the JSON payloads the frontend expects.
    beers_upload = next(
        u for u in fake_s3.uploads if u["Key"] == "beers_all.json"
    )
    assert json.loads(beers_upload["Body"]) == beers_payload


def test_lambda_handler_uploads_nothing_when_invalid(
    fetch_api_data, monkeypatch, beers_payload
):
    """A bad payload must not overwrite any S3 object."""
    module = fetch_api_data
    fake_s3 = _FakeS3()

    broken_beers = copy.deepcopy(beers_payload)
    del broken_beers["beers"][0]["beer"]["beer_style"]

    _stub_credentials(monkeypatch, module)
    monkeypatch.setattr(module, "s3", fake_s3)
    monkeypatch.setattr(module, "S3_BUCKET_NAME", "prod-bucket")
    monkeypatch.setattr(module, "get_all_beers", lambda: broken_beers["beers"])

    result = module.lambda_handler(None, None)

    assert result["statusCode"] == 500
    assert fake_s3.uploads == []

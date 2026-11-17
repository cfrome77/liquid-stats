import json
import os
import sys

import pytest

LAMBDA_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO_ROOT = os.path.dirname(LAMBDA_DIR)
DATA_DIR = os.path.join(REPO_ROOT, "src", "assets", "data")

# Make `fetch_api_data` importable from the tests without installing the lambda
# as a package.
sys.path.insert(0, LAMBDA_DIR)


@pytest.fixture
def fetch_api_data():
    import fetch_api_data as module

    return module


def load_fixture(name):
    with open(os.path.join(DATA_DIR, name), encoding="utf-8") as handle:
        return json.load(handle)


@pytest.fixture
def fixtures():
    return load_fixture

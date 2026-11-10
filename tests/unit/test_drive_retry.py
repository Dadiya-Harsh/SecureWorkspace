"""
Unit tests for retry logic, exponential backoff, and jitter.
"""

import requests
from secureworkspace_core.storage.adapter import RateLimitError
from secureworkspace_core.storage.retry import (
    calculate_backoff,
    retry_call,
)


def test_calculate_backoff():
    # Attempt 0: base 0.5 -> 0.5 <= delay <= 1.0 (with jitter)
    delay0 = calculate_backoff(0, base_delay=0.5, max_delay=10.0, jitter=True)
    assert 0.5 <= delay0 <= 1.0

    # Attempt 1: base 0.5 * 2 = 1.0 -> 1.0 <= delay <= 1.5
    delay1 = calculate_backoff(1, base_delay=0.5, max_delay=10.0, jitter=True)
    assert 1.0 <= delay1 <= 1.5

    # Max delay ceiling
    delay_huge = calculate_backoff(10, base_delay=0.5, max_delay=10.0, jitter=False)
    assert delay_huge == 10.0


def test_retry_success_after_transient_failures():
    calls = 0

    def mock_flaky_service():
        nonlocal calls
        calls += 1
        if calls < 3:
            # Simulate 503 Service Unavailable
            res = requests.Response()
            res.status_code = 503
            return res
        # Success on 3rd attempt
        res = requests.Response()
        res.status_code = 200
        return res

    result = retry_call(mock_flaky_service, max_attempts=5, base_delay=0.01)
    assert result.status_code == 200
    assert calls == 3


def test_retry_exhaustion_on_rate_limit():
    def mock_rate_limited():
        res = requests.Response()
        res.status_code = 429
        return res

    import pytest
    with pytest.raises(RateLimitError):
        retry_call(mock_rate_limited, max_attempts=3, base_delay=0.01)

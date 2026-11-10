"""
Exponential backoff, randomized jitter, and retry handling for storage API requests.
Zero external dependencies; runs seamlessly on desktop and Android.
"""

import functools
import random
import time
from typing import Any, Callable, Tuple, Type
import requests
from secureworkspace_core.storage.adapter import RateLimitError, StorageError

# HTTP status codes that indicate transient errors safe for retrying
RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}


def calculate_backoff(
    attempt: int,
    base_delay: float = 0.5,
    max_delay: float = 30.0,
    jitter: bool = True,
) -> float:
    """
    Calculates exponential backoff delay: min(max_delay, base * 2^attempt) + jitter.
    """
    delay = min(max_delay, base_delay * (2 ** attempt))
    if jitter:
        # Full randomized jitter up to 50% of base
        delay += random.uniform(0.0, 0.5)
    return delay


def retry_call(
    fn: Callable[..., Any],
    max_attempts: int = 5,
    base_delay: float = 0.5,
    max_delay: float = 30.0,
    retryable_exceptions: Tuple[Type[Exception], ...] = (
        requests.exceptions.ConnectionError,
        requests.exceptions.Timeout,
    ),
) -> Any:
    """
    Executes a function with exponential backoff and jitter on transient network/HTTP errors.
    """
    last_exception = None

    for attempt in range(max_attempts):
        try:
            res = fn()
            if isinstance(res, requests.Response):
                if res.status_code == 429:
                    retry_after = res.headers.get("Retry-After")
                    sleep_time = float(retry_after) if retry_after and retry_after.isdigit() else calculate_backoff(attempt, base_delay, max_delay)
                    if attempt == max_attempts - 1:
                        raise RateLimitError("Google Drive API rate limit exceeded (HTTP 429).")
                    time.sleep(sleep_time)
                    continue

                if res.status_code in RETRYABLE_STATUS_CODES:
                    if attempt == max_attempts - 1:
                        res.raise_for_status()
                    time.sleep(calculate_backoff(attempt, base_delay, max_delay))
                    continue

            return res

        except requests.exceptions.HTTPError as e:
            last_exception = e
            status = getattr(e.response, "status_code", 0)
            if status in RETRYABLE_STATUS_CODES and attempt < max_attempts - 1:
                time.sleep(calculate_backoff(attempt, base_delay, max_delay))
                continue
            raise

        except retryable_exceptions as e:
            last_exception = e
            if attempt < max_attempts - 1:
                time.sleep(calculate_backoff(attempt, base_delay, max_delay))
                continue
            raise StorageError(f"Network error after {max_attempts} attempts: {e}") from e

    if last_exception:
        raise last_exception

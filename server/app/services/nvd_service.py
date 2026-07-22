import json
import logging
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Optional
from ..core.config import settings

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
LOCAL_CVE_DB_PATH = DATA_DIR / "cve_database.json"
MITRE_MAP_PATH = DATA_DIR / "mitre_mapping.json"

# In-memory TTL Cache: (software, version) -> (timestamp, list[dict])
_CACHE: dict[tuple[str, str], tuple[float, list[dict]]] = {}
CACHE_TTL_SECONDS = 3600  # 1 hour TTL

_mitre_mapping: Optional[dict] = None
_local_cve_database: Optional[list[dict]] = None


def _load_mitre_mapping() -> dict:
    global _mitre_mapping
    if _mitre_mapping is None:
        try:
            with open(MITRE_MAP_PATH, "r", encoding="utf-8") as f:
                _mitre_mapping = json.load(f)
        except Exception as e:
            logger.warning(f"Could not load mitre_mapping.json: {e}")
            _mitre_mapping = {}
    return _mitre_mapping


def _load_local_cve_database() -> list[dict]:
    global _local_cve_database
    if _local_cve_database is None:
        try:
            with open(LOCAL_CVE_DB_PATH, "r", encoding="utf-8") as f:
                _local_cve_database = json.load(f)
        except Exception as e:
            logger.warning(f"Could not load local cve_database.json: {e}")
            _local_cve_database = []
    return _local_cve_database or []


def _cvss_to_severity(score: float) -> str:
    if score >= 9.0:
        return "critical"
    elif score >= 7.0:
        return "high"
    elif score >= 4.0:
        return "medium"
    return "low"


def _map_cwe_to_mitre(cwe_id: Optional[str]) -> dict:
    mitre_map = _load_mitre_mapping()
    if cwe_id and cwe_id in mitre_map:
        return mitre_map[cwe_id]
    return mitre_map.get("DEFAULT", {"id": "T1190", "name": "Exploit Public-Facing Application"})


def fetch_cves_from_nvd(software: str, version: Optional[str] = None) -> list[dict]:
    """Query live NVD CVE API v2 with in-memory TTL caching and graceful local fallback."""
    sw_key = software.lower().strip()
    ver_key = (version or "").lower().strip()
    cache_key = (sw_key, ver_key)

    now = time.time()
    if cache_key in _CACHE:
        cached_time, cached_results = _CACHE[cache_key]
        if now - cached_time < CACHE_TTL_SECONDS:
            logger.info(f"Returning cached NVD results for {software} {version}")
            return cached_results

    keyword = f"{software} {version}".strip() if version else software
    # Over-fetch, then filter to entries that actually reference the product. The
    # keyword index otherwise sweeps in unrelated products (e.g. Samba CVEs for a
    # ProFTPD query), which then pollute the graph and risk scores.
    query = urllib.parse.urlencode({"keywordSearch": keyword, "resultsPerPage": 20})
    url = f"https://services.nvd.nist.gov/rest/json/cves/2.0?{query}"

    headers = {"User-Agent": "SentinelAI-CyberTwin/1.0"}
    if settings.NVD_API_KEY:
        headers["apiKey"] = settings.NVD_API_KEY

    req = urllib.request.Request(url, headers=headers)

    try:
        logger.info(f"Querying NVD API for keyword: '{keyword}'...")
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))

        vulnerabilities = data.get("vulnerabilities", [])
        cve_results = []

        for item in vulnerabilities:
            cve_item = item.get("cve", {})
            cve_id = cve_item.get("id")
            descriptions = cve_item.get("descriptions", [])
            desc = descriptions[0].get("value") if descriptions else "No description available."

            # Keep only CVEs whose description actually names the product. This drops
            # the loosely-associated keyword hits that caused mis-attribution.
            if sw_key not in desc.lower():
                continue

            # Parse CVSS v31 or v30 metrics
            metrics = cve_item.get("metrics", {})
            cvss_data = None
            if "cvssMetricV31" in metrics:
                cvss_data = metrics["cvssMetricV31"][0].get("cvssData", {})
            elif "cvssMetricV30" in metrics:
                cvss_data = metrics["cvssMetricV30"][0].get("cvssData", {})

            # Default missing CVSS to a moderate score rather than "high" so
            # unscored CVEs don't artificially inflate the risk total.
            base_score = cvss_data.get("baseScore", 5.0) if cvss_data else 5.0
            severity = _cvss_to_severity(base_score)

            # Parse CWE
            weaknesses = cve_item.get("weaknesses", [])
            cwe_id = None
            if weaknesses:
                desc_list = weaknesses[0].get("description", [])
                if desc_list:
                    cwe_id = desc_list[0].get("value")

            mitre_tech = _map_cwe_to_mitre(cwe_id)

            cve_results.append({
                "software": software,
                "version": version or "",
                "cve_id": cve_id,
                "description": desc,
                "severity": severity,
                "mitre_technique": mitre_tech,
            })

        cve_results = cve_results[:5]  # keep the top matches after filtering
        if cve_results:
            _CACHE[cache_key] = (now, cve_results)
            return cve_results

    except Exception as e:
        logger.warning(f"NVD API request failed/rate-limited for '{keyword}': {e}. Falling back to local CVE database.")

    # Fallback to local cve_database.json
    local_db = _load_local_cve_database()
    matches = [
        entry for entry in local_db
        if entry["software"].lower() == sw_key
        and (not version or entry["version"] == ver_key)
    ]

    _CACHE[cache_key] = (now, matches)
    return matches

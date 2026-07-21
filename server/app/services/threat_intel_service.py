# Threat intelligence mapping: matches ingested software against curated CVE + MITRE data

import json
import logging
from pathlib import Path

from ..core.neo4j_db import get_neo4j
from ..models.infrastructure import InfrastructurePayload

logger = logging.getLogger(__name__)

CVE_DATABASE_PATH = Path(__file__).resolve().parent.parent / "data" / "cve_database.json"

_cve_database: list[dict] | None = None


def _load_cve_database() -> list[dict]:
    global _cve_database
    if _cve_database is None:
        with open(CVE_DATABASE_PATH, "r", encoding="utf-8") as f:
            _cve_database = json.load(f)
    return _cve_database


def map_threat_intel(twin_id: str, payload: InfrastructurePayload) -> None:
    driver = get_neo4j()
    if driver is None:
        logger.warning("Neo4j driver not initialized; skipping threat intel mapping.")
        return

    cve_database = _load_cve_database()

    with driver.session() as session:
        for asset in payload.assets:
            for software in asset.software:
                matches = [
                    entry
                    for entry in cve_database
                    if entry["software"].lower() == software.name.lower()
                    and entry["version"] == software.version
                ]
                for entry in matches:
                    session.run(
                        """
                        MATCH (s:Software {name: $name, version: $version, twin_id: $twin_id})
                        MERGE (c:CVE {cve_id: $cve_id})
                        SET c.description = $description, c.severity = $severity
                        MERGE (s)-[:HAS_CVE]->(c)
                        MERGE (m:MitreTechnique {id: $mitre_id})
                        SET m.name = $mitre_name
                        MERGE (c)-[:MAPS_TO]->(m)
                        """,
                        name=software.name,
                        version=software.version,
                        twin_id=twin_id,
                        cve_id=entry["cve_id"],
                        description=entry["description"],
                        severity=entry["severity"],
                        mitre_id=entry["mitre_technique"]["id"],
                        mitre_name=entry["mitre_technique"]["name"],
                    )

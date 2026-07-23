# Threat intelligence mapping: matches ingested software against curated CVE + MITRE data

import json
import logging
from pathlib import Path

from ..core.neo4j_db import get_neo4j
from ..models.infrastructure import InfrastructurePayload
from .nvd_service import fetch_cves_from_nvd

logger = logging.getLogger(__name__)


def map_threat_intel(twin_id: str, payload: InfrastructurePayload) -> None:
    driver = get_neo4j()
    if driver is None:
        logger.warning("Neo4j driver not initialized; skipping threat intel mapping.")
        return

    with driver.session() as session:
        for asset in payload.assets:
            for software in asset.software:
                matches = fetch_cves_from_nvd(software.name, software.version)
                for entry in matches:
                    session.run(
                        """
                        MATCH (s:Software {name: $name, version: $version, twin_id: $twin_id})
                        MERGE (c:CVE {cve_id: $cve_id})
                        SET c.description = $description, c.severity = $severity,
                            c.cvss_score = $cvss_score, c.cvss_vector = $cvss_vector,
                            c.cwe = $cwe, c.references = $references
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
                        cvss_score=entry.get("cvss_score"),
                        cvss_vector=entry.get("cvss_vector", ""),
                        cwe=entry.get("cwe", ""),
                        references=entry.get("references", []),
                        mitre_id=entry["mitre_technique"]["id"],
                        mitre_name=entry["mitre_technique"]["name"],
                    )

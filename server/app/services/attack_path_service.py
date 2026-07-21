# Attack path analysis over the digital twin graph

import logging

from ..core.neo4j_db import get_neo4j

logger = logging.getLogger(__name__)

MAX_HOPS = 5

SEVERITY_WEIGHTS = {
    "critical": 40,
    "high": 25,
    "medium": 10,
    "low": 5,
}


def _get_cves_by_asset(twin_id: str, session) -> dict[str, list[dict]]:
    query = """
        MATCH (a:Asset {twin_id: $twin_id})-[:RUNS]->(:Software)-[:HAS_CVE]->(c:CVE)
        RETURN a.id AS asset_id, c.cve_id AS cve_id, c.severity AS severity
    """
    result = session.run(query, twin_id=twin_id)
    cves_by_asset: dict[str, list[dict]] = {}
    for record in result:
        cves_by_asset.setdefault(record["asset_id"], []).append(
            {"cve_id": record["cve_id"], "severity": record["severity"]}
        )
    return cves_by_asset


def _score_path(
    hop_ids: list[str],
    cves_by_asset: dict[str, list[dict]],
    excluded_cves: frozenset[str] = frozenset(),
) -> tuple[int, list[dict]]:
    unique_cves: dict[str, dict] = {}
    for asset_id in hop_ids:
        for cve in cves_by_asset.get(asset_id, []):
            if cve["cve_id"] in excluded_cves:
                continue  # patch verified in sandbox — no longer contributes to risk
            unique_cves[cve["cve_id"]] = cve

    risk_score = sum(SEVERITY_WEIGHTS.get(cve["severity"], 0) for cve in unique_cves.values())
    return min(risk_score, 100), list(unique_cves.values())


def compute_attack_paths(twin_id: str, excluded_cves: frozenset[str] = frozenset()) -> dict:
    driver = get_neo4j()
    if driver is None:
        logger.warning("Neo4j driver not initialized; returning no attack paths.")
        return {"risk_score": 0, "attack_paths": []}

    query = f"""
        MATCH path = (entry:Asset {{twin_id: $twin_id, internet_facing: true}})
                      -[:CONNECTS_TO*1..{MAX_HOPS}]->(target:Asset {{twin_id: $twin_id}})
        WHERE entry <> target
        RETURN
            entry.id AS entry_id,
            entry.name AS entry_name,
            target.id AS target_id,
            target.name AS target_name,
            [n IN nodes(path) | n.id] AS hop_ids,
            [n IN nodes(path) | n.name] AS hop_names,
            length(path) AS hops
    """

    with driver.session() as session:
        cves_by_asset = _get_cves_by_asset(twin_id, session)
        result = session.run(query, twin_id=twin_id)

        attack_paths = []
        for record in result:
            risk_score, cves = _score_path(record["hop_ids"], cves_by_asset, excluded_cves)
            attack_paths.append(
                {
                    "entry_id": record["entry_id"],
                    "entry_name": record["entry_name"],
                    "target_id": record["target_id"],
                    "target_name": record["target_name"],
                    "path": record["hop_names"],
                    "hops": record["hops"],
                    "risk_score": risk_score,
                    "cves": cves,
                }
            )

    attack_paths.sort(key=lambda p: p["risk_score"], reverse=True)
    overall_risk_score = attack_paths[0]["risk_score"] if attack_paths else 0

    return {"risk_score": overall_risk_score, "attack_paths": attack_paths}

# Business logic, LangGraph agents, digital twin logic go here

import uuid
import logging

from ..core.firestore_db import db
from ..core.neo4j_db import get_neo4j
from ..models.infrastructure import InfrastructurePayload
from .threat_intel_service import map_threat_intel

logger = logging.getLogger(__name__)


def _save_to_firestore(twin_id: str, payload: InfrastructurePayload) -> None:
    if db is None:
        logger.warning("Firestore client not initialized; skipping raw twin persistence.")
        return
    db.collection("digital_twins").document(twin_id).set(
        {"twin_id": twin_id, **payload.model_dump()}
    )


def _build_graph(twin_id: str, payload: InfrastructurePayload) -> None:
    driver = get_neo4j()
    if driver is None:
        logger.warning("Neo4j driver not initialized; skipping graph construction.")
        return

    with driver.session() as session:
        for asset in payload.assets:
            session.run(
                """
                MERGE (a:Asset {id: $id, twin_id: $twin_id})
                SET a.name = $name, a.type = $type, a.os = $os, a.internet_facing = $internet_facing
                """,
                id=asset.id,
                twin_id=twin_id,
                name=asset.name,
                type=asset.type,
                os=asset.os,
                internet_facing=asset.internet_facing,
            )
            for software in asset.software:
                session.run(
                    """
                    MATCH (a:Asset {id: $asset_id, twin_id: $twin_id})
                    MERGE (s:Software {name: $name, version: $version, twin_id: $twin_id})
                    MERGE (a)-[:RUNS]->(s)
                    """,
                    asset_id=asset.id,
                    twin_id=twin_id,
                    name=software.name,
                    version=software.version,
                )

        for connection in payload.connections:
            session.run(
                """
                MATCH (source:Asset {id: $source_id, twin_id: $twin_id})
                MATCH (target:Asset {id: $target_id, twin_id: $twin_id})
                MERGE (source)-[c:CONNECTS_TO]->(target)
                SET c.protocol = $protocol, c.port = $port
                """,
                source_id=connection.source,
                target_id=connection.target,
                twin_id=twin_id,
                protocol=connection.protocol,
                port=connection.port,
            )


def create_digital_twin(payload: InfrastructurePayload) -> str:
    twin_id = str(uuid.uuid4())
    try:
        _save_to_firestore(twin_id, payload)
    except Exception as e:
        logger.warning(f"Firestore save warning: {e}")

    try:
        _build_graph(twin_id, payload)
    except Exception as e:
        logger.warning(f"Neo4j graph construction warning: {e}")

    try:
        map_threat_intel(twin_id, payload)
    except Exception as e:
        logger.warning(f"Threat intel mapping warning: {e}")

    return twin_id

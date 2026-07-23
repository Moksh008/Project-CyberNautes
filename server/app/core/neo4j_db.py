try:
    from neo4j import GraphDatabase
except ImportError:
    GraphDatabase = None
    logger.warning("neo4j module not installed; running in neo4j-less mode.")
from .config import settings
import logging

logger = logging.getLogger(__name__)

class Neo4jDriver:
    def __init__(self):
        self.driver = None
        self.connect()

    def connect(self):
        if GraphDatabase is None:
            logger.warning("GraphDatabase driver unavailable.")
            return
        try:
            self.driver = GraphDatabase.driver(
                settings.NEO4J_URI, 
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
            )
            logger.info("Connected to Neo4j successfully.")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")

    def close(self):
        if self.driver is not None:
            self.driver.close()
            logger.info("Neo4j connection closed.")

neo4j_driver = Neo4jDriver()

def get_neo4j():
    return neo4j_driver.driver

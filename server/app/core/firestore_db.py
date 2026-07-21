import os
import logging
import firebase_admin
from firebase_admin import credentials, firestore
from .config import settings

logger = logging.getLogger(__name__)

db = None

def init_firestore():
    global db
    try:
        # Check if Firebase Admin is already initialized (e.g. by another module/test)
        try:
            firebase_admin.get_app()
            logger.info("Firebase Admin SDK already initialized.")
        except ValueError:
            # Not initialized yet, initialize it
            cred_path = settings.FIREBASE_CREDENTIALS_PATH
            if cred_path and os.path.exists(cred_path):
                logger.info(f"Initializing Firebase Admin SDK using credentials from: {cred_path}")
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            else:
                logger.warning(
                    f"FIREBASE_CREDENTIALS_PATH is not set or file does not exist (path: {cred_path}). "
                    "Attempting to initialize with Application Default Credentials (ADC)."
                )
                try:
                    firebase_admin.initialize_app()
                    logger.info("Firebase Admin SDK initialized using Application Default Credentials.")
                except Exception as adc_err:
                    logger.error(
                        f"Failed to initialize Firebase Admin SDK using Application Default Credentials: {adc_err}. "
                        "Firestore client 'db' will be set to None. "
                        "Please configure FIREBASE_CREDENTIALS_PATH or set GOOGLE_APPLICATION_CREDENTIALS for database access."
                    )
                    db = None
                    return
        
        # If initialized successfully, get firestore client
        db = firestore.client()
        logger.info("Firestore client initialized successfully.")
    except Exception as e:
        logger.error(f"Error during Firestore initialization: {e}")
        db = None

# Initialize upon module load
init_firestore()

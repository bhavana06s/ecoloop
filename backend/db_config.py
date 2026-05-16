# db_config.py - Database configuration
# Current: JSON File Storage (Hackathon MVP)
# Production: Uncomment Firebase section

import os

# ============================================
# CURRENT STORAGE: JSON Files
# ============================================
STORAGE_TYPE = "json"  # Options: "json", "firebase", "mongodb"

# ============================================
# PRODUCTION READY: Firebase Configuration
# (Uncomment for production deployment)
# ============================================
# import firebase_admin
# from firebase_admin import credentials, firestore
# 
# if STORAGE_TYPE == "firebase":
#     cred = credentials.Certificate("serviceAccountKey.json")
#     firebase_admin.initialize_app(cred)
#     db = firestore.client()
# ============================================

print(f" Using {STORAGE_TYPE.upper()} storage backend")
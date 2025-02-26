from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import os
import logging
import time
import json
import sys

# Add the parent directory to the path so we can import from app.py
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the Flask app from app.py
from app import app as flask_app

def handler(request):
    """Serverless function handler for Vercel"""
    return flask_app(request)

# Export the handler for Vercel serverless functions
app = handler

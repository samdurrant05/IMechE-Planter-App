import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import time

class PlantingApp:
    def __init__(self):
        self.app = Flask(__name__)
        CORS(self.app)

        self.current_progress = 0
        self.target_progress = 100  # fixed target for now
        self.planting_active = False
        self.lock = threading.Lock()

        # API routes
        self.app.add_url_rule('/api/start_planting', 'start_planting', self.start_planting, methods=['POST'])
        self.app.add_url_rule('/api/stop_planting', 'stop_planting', self.stop_planting, methods=['POST'])
        self.app.add_url_rule('/api/target_progress', 'target_progress', self.get_progress, methods=['GET'])
        self.app.add_url_rule('/api/is_planting', 'is_planting', self.is_planting, methods=['GET'])

    def start_planting(self):
        with self.lock:
            self.planting_active = True
            self.current_progress = 0  # TODO: Get this as amount of instructions executed
            self.target_progress = 90  # TODO: Get this as total amount of instructions in file

        return jsonify({"message": "Planting started", "targetProgress": self.target_progress})

    def stop_planting(self):
        with self.lock:
            self.planting_active = False
            self.current_progress = 0
        return jsonify({"message": "Planting stopped"})

    def get_progress(self):
        with self.lock:
            if not self.planting_active:
                return jsonify({"message": "No planting in progress"}), 404
            return jsonify({
                "currentProgress": self.current_progress,   #set this to the current progress of files executed - should be returned by movement script
                "targetProgress": self.target_progress
            })

    def is_planting(self):
        with self.lock:
            # Placeholder: you said you'll handle toggling, so just return current state
            return jsonify({"plantingActive": self.planting_active})

if __name__ == '__main__':
    planting_app = PlantingApp()

    planting_app.app.run(host='0.0.0.0', port=5000, debug=True)

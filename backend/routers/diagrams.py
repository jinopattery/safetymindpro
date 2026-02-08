from flask import Blueprint, request, jsonify

diagrams_bp = Blueprint('diagrams', __name__)

# Assume this is a temporary in-memory storage for diagrams
diagrams_storage = {}

@diagrams_bp.route('/diagrams', methods=['POST'])
def save_diagram():
    data = request.json
    diagram_id = data.get('id')
    if not diagram_id or 'nodes' not in data or 'edges' not in data:
        return jsonify({'error': 'Invalid data'}), 400
    
    diagrams_storage[diagram_id] = {'nodes': data['nodes'], 'edges': data['edges']}
    return jsonify({'message': 'Diagram saved successfully'}), 201

@diagrams_bp.route('/diagrams/<diagram_id>', methods=['GET'])
def load_diagram(diagram_id):
    diagram = diagrams_storage.get(diagram_id)
    if not diagram:
        return jsonify({'error': 'Diagram not found'}), 404
    
    return jsonify(diagram), 200

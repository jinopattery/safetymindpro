"""
Diagram Validation

Validates the connectivity and allocation rules of a SafetyMindPro graph
(React Flow format: { nodes: [...], edges: [...] }).

Rules:
- Top-level items (roots with no parent) are allowed to be unlinked — they
  generate INFO messages, not errors.
- Sub-items that are neither connected to peers nor allocated to a form
  generate WARNING messages.
- The checks reported are:
    1. Unlinked functions   (functions with no function_flow edge)
    2. Unlinked failures    (failures with no failure_propagation edge)
    3. Unlinked forms       (forms with no form_hierarchy edge)
    4. Unallocated functions (functions not linked to any form via performs_function)
    5. Unallocated failures  (failures not linked to any form via has_failure)
"""

from typing import Dict, Any, List


def validate_diagram(graph_data: Dict[str, Any], domain: str = "") -> Dict[str, Any]:
    """
    Validate a diagram graph (React Flow format) and return a structured report.

    Args:
        graph_data: dict with 'nodes' and 'edges' lists (React Flow format)
        domain: domain name (informational only, not used for logic)

    Returns:
        {
          'valid': bool,
          'summary': str,
          'checks': [ { 'check': str, 'status': 'pass'|'warn'|'info', 'message': str, 'items': [...] }, ... ],
          'stats': { 'forms': int, 'functions': int, 'failures': int, 'edges': int }
        }
    """
    nodes = graph_data.get("nodes", [])
    edges = graph_data.get("edges", [])

    # Build lookup maps
    node_by_id: Dict[str, Any] = {}
    for n in nodes:
        node_by_id[n["id"]] = n

    forms     = [n for n in nodes if _get_layer(n) == "form"]
    functions = [n for n in nodes if _get_layer(n) == "function"]
    failures  = [n for n in nodes if _get_layer(n) == "failure"]

    # Build edge type sets
    # Each set contains node IDs that participate in that edge type
    func_flow_nodes:        set = set()   # nodes involved in function_flow edges
    fail_prop_nodes:        set = set()   # nodes involved in failure_propagation edges
    form_hierarchy_nodes:   set = set()   # nodes involved in form_hierarchy edges
    performs_function_targets: set = set()  # function IDs linked via performs_function
    has_failure_targets:    set = set()   # failure IDs linked via has_failure

    for e in edges:
        edge_type = _get_edge_type(e)
        src = e.get("source", "")
        tgt = e.get("target", "")

        if edge_type == "function_flow":
            func_flow_nodes.add(src)
            func_flow_nodes.add(tgt)
        elif edge_type == "failure_propagation":
            fail_prop_nodes.add(src)
            fail_prop_nodes.add(tgt)
        elif edge_type == "form_hierarchy":
            form_hierarchy_nodes.add(src)
            form_hierarchy_nodes.add(tgt)
        elif edge_type == "performs_function":
            performs_function_targets.add(tgt)
        elif edge_type == "has_failure":
            has_failure_targets.add(tgt)

    # Identify top-level / root nodes per layer
    # A form is a root form if it is NOT a child in any form_hierarchy edge
    form_children = {e.get("target") for e in edges if _get_edge_type(e) == "form_hierarchy"}
    root_forms = {n["id"] for n in forms if n["id"] not in form_children}

    # A function is a root function if it has no parent in function_flow
    func_flow_children = {e.get("target") for e in edges if _get_edge_type(e) == "function_flow"}
    root_functions = {n["id"] for n in functions if n["id"] not in func_flow_children}

    # A failure is a root failure if it has no parent in failure_propagation
    fail_prop_children = {e.get("target") for e in edges if _get_edge_type(e) == "failure_propagation"}
    root_failures = {n["id"] for n in failures if n["id"] not in fail_prop_children}

    checks: List[Dict[str, Any]] = []

    # ── Check 1: Unlinked functions ──────────────────────────────────────────
    unlinked_funcs = [n for n in functions if n["id"] not in func_flow_nodes]
    if unlinked_funcs:
        # Root functions are allowed to be unlinked (INFO), others are warnings
        unlinked_non_root = [n for n in unlinked_funcs if n["id"] not in root_functions]
        if unlinked_non_root:
            checks.append({
                "check": "Function Connectivity",
                "status": "warn",
                "message": (
                    f"{len(unlinked_non_root)} function(s) have no function_flow connections. "
                    "Connect them to build the functional network."
                ),
                "items": [_node_label(n) for n in unlinked_non_root],
            })
        root_unlinked = [n for n in unlinked_funcs if n["id"] in root_functions]
        if root_unlinked:
            checks.append({
                "check": "Standalone Functions",
                "status": "info",
                "message": (
                    f"{len(root_unlinked)} root function(s) are standalone "
                    "(top-level items may remain independent)."
                ),
                "items": [_node_label(n) for n in root_unlinked],
            })
    else:
        if functions:
            checks.append({
                "check": "Function Connectivity",
                "status": "pass",
                "message": "All functions are connected in the functional network.",
                "items": [],
            })

    # ── Check 2: Unlinked failures ───────────────────────────────────────────
    unlinked_fails = [n for n in failures if n["id"] not in fail_prop_nodes]
    if unlinked_fails:
        unlinked_non_root_f = [n for n in unlinked_fails if n["id"] not in root_failures]
        if unlinked_non_root_f:
            checks.append({
                "check": "Failure Connectivity",
                "status": "warn",
                "message": (
                    f"{len(unlinked_non_root_f)} failure(s) have no failure_propagation connections. "
                    "Connect them to model failure propagation."
                ),
                "items": [_node_label(n) for n in unlinked_non_root_f],
            })
        root_unlinked_f = [n for n in unlinked_fails if n["id"] in root_failures]
        if root_unlinked_f:
            checks.append({
                "check": "Standalone Failures",
                "status": "info",
                "message": (
                    f"{len(root_unlinked_f)} root failure(s) are standalone "
                    "(top-level items may remain independent)."
                ),
                "items": [_node_label(n) for n in root_unlinked_f],
            })
    else:
        if failures:
            checks.append({
                "check": "Failure Connectivity",
                "status": "pass",
                "message": "All failures are connected in the failure tree.",
                "items": [],
            })

    # ── Check 3: Unlinked forms ──────────────────────────────────────────────
    unlinked_forms = [n for n in forms if n["id"] not in form_hierarchy_nodes]
    if unlinked_forms:
        unlinked_non_root_fm = [n for n in unlinked_forms if n["id"] not in root_forms]
        if unlinked_non_root_fm:
            checks.append({
                "check": "Form Connectivity",
                "status": "warn",
                "message": (
                    f"{len(unlinked_non_root_fm)} form(s) are not connected in the form hierarchy."
                ),
                "items": [_node_label(n) for n in unlinked_non_root_fm],
            })
        root_unlinked_fm = [n for n in unlinked_forms if n["id"] in root_forms]
        if root_unlinked_fm:
            checks.append({
                "check": "Standalone Forms",
                "status": "info",
                "message": (
                    f"{len(root_unlinked_fm)} root form(s) are standalone "
                    "(top-level items may remain independent)."
                ),
                "items": [_node_label(n) for n in root_unlinked_fm],
            })
    else:
        if forms:
            checks.append({
                "check": "Form Connectivity",
                "status": "pass",
                "message": "All forms are connected in the form hierarchy.",
                "items": [],
            })

    # ── Check 4: Functions allocated to a form ───────────────────────────────
    unallocated_funcs = [n for n in functions if n["id"] not in performs_function_targets]
    if unallocated_funcs:
        checks.append({
            "check": "Function Allocation",
            "status": "warn",
            "message": (
                f"{len(unallocated_funcs)} function(s) are not allocated to any form "
                "(no performs_function edge). Link a Form→Function to allocate."
            ),
            "items": [_node_label(n) for n in unallocated_funcs],
        })
    else:
        if functions:
            checks.append({
                "check": "Function Allocation",
                "status": "pass",
                "message": "All functions are allocated to at least one form.",
                "items": [],
            })

    # ── Check 5: Failures allocated to a form ────────────────────────────────
    unallocated_fails = [n for n in failures if n["id"] not in has_failure_targets]
    if unallocated_fails:
        checks.append({
            "check": "Failure Allocation",
            "status": "warn",
            "message": (
                f"{len(unallocated_fails)} failure(s) are not allocated to any form "
                "(no has_failure edge). Link a Form→Failure to allocate."
            ),
            "items": [_node_label(n) for n in unallocated_fails],
        })
    else:
        if failures:
            checks.append({
                "check": "Failure Allocation",
                "status": "pass",
                "message": "All failures are allocated to at least one form.",
                "items": [],
            })

    # ── Empty diagram check ───────────────────────────────────────────────────
    if not nodes:
        checks.append({
            "check": "Diagram Content",
            "status": "error",
            "message": "The diagram is empty. Add Form, Function and Failure nodes first.",
            "items": [],
        })

    # Determine overall validity: only errors block graph algorithms
    # Warnings are reported but do not block execution
    errors = [c for c in checks if c["status"] == "error"]
    warnings = [c for c in checks if c["status"] == "warn"]
    passes = [c for c in checks if c["status"] == "pass"]

    valid = len(errors) == 0

    if not checks:
        summary = "No nodes found matching form/function/failure layers."
        valid = False
    elif errors:
        summary = f"Validation FAILED: {len(errors)} error(s), {len(warnings)} warning(s)."
    elif warnings:
        summary = (
            f"Validation PASSED with {len(warnings)} warning(s). "
            "Graph algorithms can proceed."
        )
    else:
        summary = f"Validation PASSED: {len(passes)} check(s) OK. Graph algorithms can proceed."

    return {
        "valid": valid,
        "summary": summary,
        "checks": checks,
        "stats": {
            "forms": len(forms),
            "functions": len(functions),
            "failures": len(failures),
            "edges": len(edges),
        },
    }


# ── Helpers ──────────────────────────────────────────────────────────────────

def _get_layer(node: Dict[str, Any]) -> str:
    """Extract the layer from a React Flow node."""
    # Layer may be directly on node or inside node.data
    layer = node.get("data", {}).get("layer") or node.get("layer", "")
    return layer


def _get_edge_type(edge: Dict[str, Any]) -> str:
    """Extract the domain edge type from a React Flow edge."""
    # edgeType is stored inside edge.data dict
    return edge.get("data", {}).get("edgeType", "") or edge.get("type", "")


def _node_label(node: Dict[str, Any]) -> str:
    """Extract a human-readable label from a React Flow node."""
    label = node.get("data", {}).get("label") or node.get("label") or node.get("id", "unknown")
    # Strip leading emoji/icon characters if any
    return label.strip()

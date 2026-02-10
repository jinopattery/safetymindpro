"""
Users Router - User Profile and Management
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from backend.database import get_db
from backend.models import User, Project, Graph
from backend.routers.auth import get_current_user, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])

# Schemas
class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str | None
    domain: str
    created_at: str
    is_public: bool

class GraphResponse(BaseModel):
    id: int
    name: str
    domain: str
    created_at: str

class UserProfileResponse(BaseModel):
    user: UserResponse
    projects_count: int
    graphs_count: int
    recent_projects: List[ProjectResponse]

# Routes
@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's profile with statistics"""
    projects = db.query(Project).filter(Project.owner_id == current_user.id).all()
    graphs = db.query(Graph).filter(Graph.owner_id == current_user.id).all()
    
    recent_projects = sorted(projects, key=lambda x: x.updated_at, reverse=True)[:5]
    
    return {
        "user": UserResponse(
            id=current_user.id,
            email=current_user.email,
            username=current_user.username,
            full_name=current_user.full_name,
            is_active=current_user.is_active,
            is_superuser=current_user.is_superuser
        ),
        "projects_count": len(projects),
        "graphs_count": len(graphs),
        "recent_projects": [
            ProjectResponse(
                id=p.id,
                name=p.name,
                description=p.description,
                domain=p.domain,
                created_at=p.created_at.isoformat(),
                is_public=p.is_public
            )
            for p in recent_projects
        ]
    }

@router.get("/projects")
async def get_user_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all projects for current user"""
    projects = db.query(Project).filter(Project.owner_id == current_user.id).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "domain": p.domain,
            "created_at": p.created_at.isoformat(),
            "updated_at": p.updated_at.isoformat(),
            "is_public": p.is_public,
            "graphs_count": len(p.graphs)
        }
        for p in projects
    ]

@router.get("/graphs")
async def get_user_graphs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all graphs for current user"""
    graphs = db.query(Graph).filter(Graph.owner_id == current_user.id).all()
    return [
        {
            "id": g.id,
            "name": g.name,
            "domain": g.domain,
            "project_id": g.project_id,
            "created_at": g.created_at.isoformat(),
            "updated_at": g.updated_at.isoformat(),
            "nodes_count": len(g.graph_data.get("nodes", [])) if g.graph_data else 0,
            "edges_count": len(g.graph_data.get("edges", [])) if g.graph_data else 0
        }
        for g in graphs
    ]

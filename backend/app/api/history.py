from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.models.history import ExecutionHistory
from app.schemas.history import HistoryItemResponse, HistoryListResponse

router = APIRouter(prefix="/history", tags=["History"])

@router.get("", response_model=HistoryListResponse)
def get_history(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    method: Optional[str] = None,
    outcome: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve filtered execution history with pagination."""
    query = db.query(ExecutionHistory)

    if method and method.upper() != "ALL":
        query = query.filter(ExecutionHistory.method == method.upper())

    if outcome and outcome.upper() != "ALL":
        query = query.filter(ExecutionHistory.outcome == outcome.upper())

    if search:
        query = query.filter(
            (ExecutionHistory.url.contains(search)) | 
            (ExecutionHistory.test_case_name.contains(search))
        )

    total = query.count()
    items = (
        query.order_by(desc(ExecutionHistory.created_at))
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return HistoryListResponse(
        total=total,
        page=page,
        limit=limit,
        items=[HistoryItemResponse.model_validate(item) for item in items]
    )

@router.get("/{id}", response_model=HistoryItemResponse)
def get_history_item(id: int, db: Session = Depends(get_db)):
    """Retrieve full details of a specific execution log."""
    item = db.query(ExecutionHistory).filter(ExecutionHistory.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Execution history item not found")
    return item

@router.delete("", status_code=status.HTTP_200_OK)
def clear_history(confirm: bool = Query(False), db: Session = Depends(get_db)):
    """Clear all execution history records. Requires confirm=true."""
    if not confirm:
        raise HTTPException(
            status_code=400,
            detail="Confirmation required: pass confirm=true to clear all execution history"
        )
    
    deleted_count = db.query(ExecutionHistory).delete()
    db.commit()
    return {"message": "Execution history cleared successfully", "deleted_records": deleted_count}

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_history_item(id: int, db: Session = Depends(get_db)):
    """Delete a single execution history entry."""
    item = db.query(ExecutionHistory).filter(ExecutionHistory.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Execution history item not found")
    
    db.delete(item)
    db.commit()
    return None

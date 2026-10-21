import time
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.models.test_case import TestCase
from app.schemas.test_case import (
    TestCaseCreate,
    TestCaseUpdate,
    TestCaseResponse,
    BatchRunResponse,
    BatchRunItemResult
)
from app.schemas.requests import RequestExecution, RequestResponse
from app.api.requests import execute_request

router = APIRouter(prefix="/test-cases", tags=["Test Cases"])

@router.get("", response_model=List[TestCaseResponse])
def get_all_test_cases(db: Session = Depends(get_db)):
    """Retrieve all saved test cases."""
    return db.query(TestCase).order_by(desc(TestCase.updated_at)).all()

@router.post("", response_model=TestCaseResponse, status_code=status.HTTP_201_CREATED)
def create_test_case(test_case_in: TestCaseCreate, db: Session = Depends(get_db)):
    """Create a new automated test case with assertions."""
    db_obj = TestCase(
        name=test_case_in.name,
        description=test_case_in.description,
        method=test_case_in.method.upper(),
        url=test_case_in.url,
        headers=test_case_in.headers,
        params=test_case_in.params,
        body=test_case_in.body,
        assertions=[a.model_dump() for a in test_case_in.assertions]
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/{id}", response_model=TestCaseResponse)
def get_test_case(id: int, db: Session = Depends(get_db)):
    """Retrieve a single test case by ID."""
    test_case = db.query(TestCase).filter(TestCase.id == id).first()
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    return test_case

@router.put("/{id}", response_model=TestCaseResponse)
def update_test_case(id: int, test_case_in: TestCaseUpdate, db: Session = Depends(get_db)):
    """Update an existing test case."""
    test_case = db.query(TestCase).filter(TestCase.id == id).first()
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")

    update_data = test_case_in.model_dump(exclude_unset=True)
    if "method" in update_data and update_data["method"]:
        update_data["method"] = update_data["method"].upper()
    if "assertions" in update_data and update_data["assertions"] is not None:
        update_data["assertions"] = [a.model_dump() if hasattr(a, "model_dump") else a for a in update_data["assertions"]]

    for field, value in update_data.items():
        setattr(test_case, field, value)

    db.commit()
    db.refresh(test_case)
    return test_case

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_test_case(id: int, db: Session = Depends(get_db)):
    """Delete a test case by ID."""
    test_case = db.query(TestCase).filter(TestCase.id == id).first()
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")

    db.delete(test_case)
    db.commit()
    return None

@router.post("/{id}/run", response_model=RequestResponse)
async def run_test_case(id: int, db: Session = Depends(get_db)):
    """Run an individual test case, evaluate assertions, and log results."""
    test_case = db.query(TestCase).filter(TestCase.id == id).first()
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")

    exec_req = RequestExecution(
        method=test_case.method,
        url=test_case.url,
        headers=test_case.headers or {},
        params=test_case.params or {},
        body=test_case.body,
        assertions=test_case.assertions or [],
        save_to_history=True,
        test_case_id=test_case.id,
        test_case_name=test_case.name
    )

    return await execute_request(exec_req, db)

@router.post("/run-all", response_model=BatchRunResponse)
async def run_all_test_cases(db: Session = Depends(get_db)):
    """Run all test cases sequentially and generate an overall test suite report."""
    test_cases = db.query(TestCase).order_by(TestCase.id.asc()).all()
    
    start_time = time.perf_counter()
    results: List[BatchRunItemResult] = []
    passed = 0
    failed = 0
    errors = 0

    for tc in test_cases:
        exec_req = RequestExecution(
            method=tc.method,
            url=tc.url,
            headers=tc.headers or {},
            params=tc.params or {},
            body=tc.body,
            assertions=tc.assertions or [],
            save_to_history=True,
            test_case_id=tc.id,
            test_case_name=tc.name
        )
        res = await execute_request(exec_req, db)
        
        if res.outcome == "PASS":
            passed += 1
        elif res.outcome == "FAIL":
            failed += 1
        else:
            errors += 1

        results.append(BatchRunItemResult(
            test_case_id=tc.id,
            test_case_name=tc.name,
            result=res
        ))

    total_time_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

    return BatchRunResponse(
        total=len(test_cases),
        passed=passed,
        failed=failed,
        errors=errors,
        total_time_ms=total_time_ms,
        items=results
    )

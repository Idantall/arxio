from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, List
import enum, uuid

class Severity(str, enum.Enum):
    CRITICAL='CRITICAL'
    HIGH='HIGH'
    MEDIUM='MEDIUM'
    LOW='LOW'
    INFO='INFO'

class ScanStatus(str, enum.Enum):
    QUEUED='QUEUED'
    RUNNING='RUNNING'
    SUCCESS='SUCCESS'
    ERROR='ERROR'

class ScanResult(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    project_id: str
    status: ScanStatus = Field(default=ScanStatus.QUEUED)
    started_at: datetime = Field(default_factory=datetime.utcnow)
    finished_at: Optional[datetime] = None
    findings: List["Finding"] = Relationship(back_populates="scan")

class Finding(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    scan_id: str = Field(foreign_key="scanresult.id")
    rule_id: str
    title: str
    description: str
    severity: Severity
    file_path: Optional[str] = None
    line_start: Optional[int] = None
    line_end: Optional[int] = None
    url: Optional[str] = None
    scan: ScanResult = Relationship(back_populates="findings") 
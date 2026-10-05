from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

ParticipantName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)
]


class ParticipantCreate(BaseModel):
    name: ParticipantName


class ParticipantRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    party_id: int
    name: str
    created_at: datetime

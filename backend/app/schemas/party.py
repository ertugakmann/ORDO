from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

PartyName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)
]


class PartyCreate(BaseModel):
    name: PartyName


class PartyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    join_code: str
    menu_confirmed: bool
    created_at: datetime

from pydantic import BaseModel
from typing import Optional, List


class AnimeMetaResponse(BaseModel):
    id: str
    title: str
    image: str
    url: str

#DTO для регистрации/логина
class UserCreate(BaseModel):
    username: str
    password: str

#структура ответа сервера при успешном логине
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

#данные внутри JWT
class TokenData(BaseModel):
    username: Optional[str] = None

#DTO для отметки аниме (избранное/просмотрено)
class AnimeInteractionUpdate(BaseModel):
    anime_id: str
    is_favorite: Optional[bool] = None
    is_watched: Optional[bool] = None
    title: Optional[str] = None
    image: Optional[str] = None
    url: Optional[str] = None

#DTO элемента внутри тирлиста (какое аниме, на каком ранге и на какой позиции)
class TierListItemSchema(BaseModel):
    anime_id: str
    rank: str
    position: int
    meta: Optional[AnimeMetaResponse] = None

#DTO для создания/обновления тирлиста
class TierListCreate(BaseModel):
    title: str
    items: List[TierListItemSchema]

#DTO для отдачи тирлиста клиенту
class TierListResponse(BaseModel):
    id: int
    title: str
    items: List[TierListItemSchema]
from pydantic import BaseModel
from typing import Optional, List, Any
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from config import Base

#КЛАССЫ СУЩНОСТЕЙ БД

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserAnimeInteraction(Base):
    __tablename__ = "user_anime_interactions"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    anime_id = Column(String(50), primary_key=True)

    is_favorite = Column(Boolean, default=False)
    is_watched = Column(Boolean, default=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class TierList(Base):
    __tablename__ = "tier_lists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class TierListItem(Base):
    __tablename__ = "tier_list_items"

    id = Column(Integer, primary_key=True, index=True)
    tier_list_id = Column(Integer, ForeignKey("tier_lists.id", ondelete="CASCADE"))
    anime_id = Column(String(50), nullable=False)
    rank = Column(String(10), nullable=False)
    position = Column(Integer, nullable=True)
    
class AnimeMetadata(Base):
    __tablename__ = "anime_metadata"
    anime_id = Column(String(50), primary_key=True)
    title = Column(String(255))
    image = Column(String(500))
    url = Column(String(500))

#КЛАССЫ ВНЕШНЕГО API

# поиск
class SearchResult(BaseModel):
    link: Optional[str]
    id: Optional[str]
    slug: Optional[str]
    title: Optional[str]
    original_title: Optional[str]
    image: Optional[str]
    rating: Optional[str]

# информация об аниме
class RelatedAnime(BaseModel):
    image: Optional[str]
    link: Optional[str]
    relation: Optional[str]
    title: Optional[str]
    type: Optional[str]
    year: Optional[str]

class MainCharacter(BaseModel):
    character: Optional[str]
    voice_actor: Optional[str]

class AnimeInfo(BaseModel):
    aired_at: Optional[str]
    anime_season: Optional[str]
    author: Optional[str]
    description: Optional[str]
    director: Optional[str]
    duration: Optional[str]
    episodes: Optional[str]
    genres: Optional[List[str]]
    image: Optional[str]
    main_characters: Optional[List[MainCharacter]]
    minimal_age: Optional[str]
    mpaa_rating: Optional[str]
    next_episode: Optional[str]
    original_source: Optional[str]
    other_titles: Optional[str]
    related: Optional[List[RelatedAnime]]
    score: Optional[str]
    screenshots: Optional[List[str]]
    status: Optional[str]
    studio: Optional[str]
    theme: Optional[str]
    title: Optional[str]
    translations: Optional[List[str]]
    type: Optional[str]

# эпизоды
class EpisodeInfo(BaseModel):
    air_date: Optional[str]
    is_released: Optional[bool]
    seria: Optional[int]
    title: Optional[str]

# расписание
class ScheduleItem(BaseModel):
    episode: Optional[str]
    image: Optional[str]
    link: Optional[str]
    time: Optional[str]
    title: Optional[str]

class Schedule(BaseModel):
    schedule: Optional[dict]
    schedule_dates: Optional[dict]

# обновления
class AnimeUpdate(BaseModel):
    episode: Optional[str]
    image: Optional[str]
    link: Optional[str]
    time: Optional[str]
    title: Optional[str]
    translation: Optional[str]

# текущий сезон
class SeasonAnime(BaseModel):
    image: Optional[str]
    link: Optional[str]
    title: Optional[str]
    other_title: Optional[str]
    score: Optional[str]

# озвучки и стриминг
class VoiceInfo(BaseModel):
    label: Optional[str]
    translation_id: Optional[str]
    player: Optional[str]
    embed: Optional[str]
    cvh_id: Optional[str]

class VoicesResponse(BaseModel):
    voices: Optional[List[VoiceInfo]]
    total_episodes: Optional[int]

class StreamResponse(BaseModel):
    url: Optional[str]
    content: Optional[str]
    kind: Optional[str]

class CVHStreamResponse(BaseModel):
    HLS: Optional[str]
    DASH: Optional[str]
    MP4s: Optional[List[str]]

#классы Shikimori
# каталог карточка из Shikimori
class CatalogAnime(BaseModel):
    shikimori_id: Optional[str]
    title: Optional[str]
    original_title: Optional[str]
    poster: Optional[str]
    year: Optional[str]
    type: Optional[str]
    url: Optional[str]

# пагинированный ответ каталога
class CatalogResponse(BaseModel):
    items: List[CatalogAnime]
    page: int
    page_size: int
    has_next: bool

# результат разрешения ссылки AnimeGo
class AnimeGoLinkResult(BaseModel):
    animego_url: Optional[str]
    animego_id: Optional[str]
    found: bool

# дополнительно
class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None

class SuccessResponse(BaseModel):
    success: bool
    data: Any
import difflib
import logging
from datetime import timedelta

from anime_parsers_ru import ShikimoriParser
from anime_parsers_ru.errors import (
    NoResults,
    ServiceError,
    ContentBlocked,
    TooManyRequests,
    ServiceIsOverloaded,
    UnexpectedBehavior,
)
from fastapi import FastAPI, Depends, Query, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from fastapi_cache.decorator import cache
from contextlib import asynccontextmanager

from jose import jwt, JWTError
from sqlalchemy.orm import Session
from typing import List, Optional

from starlette import status

import security
from config import HOST, PORT, DEBUG, engine, Base, SessionLocal, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
import schemas
from models import (
    AnimeInfo,
    AnimeMetadata,
    AnimeUpdate,
    CVHStreamResponse,
    EpisodeInfo,
    Schedule,
    SearchResult,
    SeasonAnime,
    StreamResponse,
    VoicesResponse,
    User,
    UserAnimeInteraction,
    TierList,
    TierListItem, CatalogResponse, CatalogAnime, AnimeGoLinkResult
)
from parser_service import AnimegoParser, get_parser, get_shikimori_parser

logging.basicConfig(
    level=logging.DEBUG if DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

SHIKIMORI_GENRES = {
    "1-Action": "Экшен",
    "2-Adventure": "Приключения",
    "3-Racing": "Гонки",
    "4-Comedy": "Комедия",
    "5-Avant-Garde": "Авангард",
    "6-Mythology": "Мифология",
    "7-Mystery": "Тайна",
    "8-Drama": "Драма",
    "10-Fantasy": "Фэнтези",
    "11-Strategy-Game": "Стратегические игры",
    "13-Historical": "Исторический",
    "14-Horror": "Ужасы",
    "17-Martial-Arts": "Боевые искусства",
    "18-Mecha": "Меха",
    "19-Music": "Музыка",
    "20-Parody": "Пародия",
    "21-Samurai": "Самураи",
    "22-Romance": "Романтика",
    "23-School": "Школа",
    "24-Sci-Fi": "Фантастика",
    "27-Shounen": "Сёнен",
    "29-Space": "Космос",
    "30-Sports": "Спорт",
    "31-Super-Power": "Супер сила",
    "32-Vampire": "Вампиры",
    "36-Slice-of-Life": "Повседневность",
    "37-Supernatural": "Сверхъестественное",
    "38-Military": "Военное",
    "39-Detective": "Детектив",
    "40-Psychological": "Психологическое",
    "42-Seinen": "Сэйнэн",
    "102-Team-Sports": "Командный спорт",
    "103-Video-Game": "Видеоигры",
    "106-Reincarnation": "Реинкарнация",
    "107-Love-Polygon": "Любовный многоугольник",
    "108-Visual-Arts": "Изобразительное искусство",
    "111-Time-Travel": "Путешествие во времени",
    "112-Gag-Humor": "Гэг-юмор",
    "114-Award-Winning": "Удостоено наград",
    "117-Suspense": "Триллер",
    "118-Combat-Sports": "Спортивные единоборства",
    "130-Isekai": "Исэкай",
    "131-Delinquents": "Хулиганы",
    "136-Showbiz": "Шоу-бизнес",
    "137-Otaku-Culture": "Культура отаку",
    "138-Organized-Crime": "Организованная преступность",
    "139-Workplace": "Работа",
    "141-Survival": "Выживание",
    "142-Performing-Arts": "Исполнительское искусство",
    "146-High-Stakes-Game": "Игра с высокими ставками",
    "147-Medical": "Медицина",
    "148-Pets": "Питомцы",
    "149-Educational": "Образовательное",
}

SHIKIMORI_STATUSES = ["ongoing", "anons", "released", "latest"]
SHIKIMORI_TYPES = ["tv", "movie", "ova", "ona", "special"]
SHIKIMORI_SORTS = ["rating", "popularity", "name", "aired_on", "id_desc"]

@asynccontextmanager
async def lifespan(app: FastAPI):
    FastAPICache.init(InMemoryBackend())
    print("Кэш инициализирован, сервер запущен")
    yield
    print("Сервер останавливается, чистим ресурсы")

app = FastAPI(
    title="Anime Backend (AnimeGO)",
    description="REST API бэкенд для аниме-сайта на основе библиотеки anime-parsers-ru",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

#CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#база данных
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

#обработчики ошибок
def handle_parser_error(e: Exception):
    if isinstance(e, NoResults):
        raise HTTPException(
            status_code=404,
            detail={"error": "Результаты не найдены", "detail": str(e)}
        )
    if isinstance(e, TooManyRequests):
        raise HTTPException(
            status_code=429,
            detail={"error": "Слишком много запросов, попробуйте позже", "detail": str(e)}
        )
    if isinstance(e, ContentBlocked):
        raise HTTPException(
            status_code=403,
            detail={"error": "Контент заблокирован или недоступен", "detail": str(e)}
        )
    if isinstance(e, ServiceIsOverloaded):
        raise HTTPException(
            status_code=503,
            detail={"error": "Сервис перегружен, попробуйте позже", "detail": str(e)}
        )
    if isinstance(e, (ServiceError, UnexpectedBehavior)):
        raise HTTPException(
            status_code=502,
            detail={"error": "Ошибка удалённого сервиса", "detail": str(e)}
        )
    logger.exception("Непредвиденная ошибка: %s", e)
    raise HTTPException(
        status_code=500,
        detail={"error": "Внутренняя ошибка сервера", "detail": str(e)}
    )


#ЭНДПОИНТЫ БАЗЫ ДАННЫХ

#система защиты
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось валидировать учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

#логин\регистрация
@app.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user_data.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Пользователь с таким именем уже существует")

    hashed_pwd = security.get_password_hash(user_data.password)
    new_user = User(username=user_data.username, password_hash=hashed_pwd)

    db.add(new_user)
    db.commit()
    return {"message": "Регистрация успешна"}


@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    refresh_token = security.create_refresh_token(data={"sub": user.username})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@app.post("/refresh", response_model=schemas.Token)
def refresh_token(refresh_token: str = Header(..., alias="refresh-token"), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Недействительный токен обновления",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise credentials_exception
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = security.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    new_refresh_token = security.create_refresh_token(data={"sub": user.username})

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


#избранное просмотренное
@app.post("/anime/interaction")
def update_anime_interaction(
    interaction: schemas.AnimeInteractionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if interaction.title or interaction.image or interaction.url:
        meta = db.query(AnimeMetadata).filter(AnimeMetadata.anime_id == interaction.anime_id).first()
        if not meta:
            meta = AnimeMetadata(
                anime_id=interaction.anime_id,
                title=interaction.title or f"Аниме #{interaction.anime_id}",
                image=interaction.image or "",
                url=interaction.url or ""
            )
            db.add(meta)
        else:
            if interaction.title: meta.title = interaction.title
            if interaction.image: meta.image = interaction.image
            if interaction.url: meta.url = interaction.url

    db_interaction = db.query(UserAnimeInteraction).filter(
        UserAnimeInteraction.user_id == current_user.id,
        UserAnimeInteraction.anime_id == interaction.anime_id
    ).first()

    if not db_interaction:
        db_interaction = UserAnimeInteraction(
            user_id=current_user.id,
            anime_id=interaction.anime_id,
            is_favorite=interaction.is_favorite or False,
            is_watched=interaction.is_watched or False
        )
        db.add(db_interaction)
    else:
        if interaction.is_favorite is not None:
            db_interaction.is_favorite = interaction.is_favorite
        if interaction.is_watched is not None:
            db_interaction.is_watched = interaction.is_watched

    db.commit()
    return {"status": "Взаимодействие обновлено"}

#список избранных аниме пользователя (теперь отдает объекты, а не ID)
@app.get("/anime/favorites", response_model=List[schemas.AnimeMetaResponse])
def get_favorites(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    favorites = db.query(UserAnimeInteraction, AnimeMetadata).outerjoin(
        AnimeMetadata, UserAnimeInteraction.anime_id == AnimeMetadata.anime_id
    ).filter(
        UserAnimeInteraction.user_id == current_user.id,
        UserAnimeInteraction.is_favorite == True
    ).all()

    return [
        {
            "id": inter.anime_id,
            "title": meta.title if meta else f"Аниме #{inter.anime_id}",
            "image": meta.image if meta else "",
            "url": meta.url if meta else ""
        } for inter, meta in favorites
    ]

# список просмотренных аниме (нужен, чтобы строить тирлист)
@app.get("/anime/watched", response_model=List[schemas.AnimeMetaResponse])
def get_watched(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    watched = db.query(UserAnimeInteraction, AnimeMetadata).outerjoin(
        AnimeMetadata, UserAnimeInteraction.anime_id == AnimeMetadata.anime_id
    ).filter(
        UserAnimeInteraction.user_id == current_user.id,
        UserAnimeInteraction.is_watched == True
    ).all()

    return [
        {
            "id": inter.anime_id,
            "title": meta.title if meta else f"Аниме #{inter.anime_id}",
            "image": meta.image if meta else "",
            "url": meta.url if meta else ""
        } for inter, meta in watched
    ]

#тирлисты
@app.post("/tierlists")
def save_tier_list(
    tl_data: schemas.TierListCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_tl = TierList(user_id=current_user.id, title=tl_data.title)
    db.add(new_tl)
    db.commit()
    db.refresh(new_tl)

    for item in tl_data.items:
        db_item = TierListItem(
            tier_list_id=new_tl.id,
            anime_id=item.anime_id,
            rank=item.rank,
            position=item.position
        )
        db.add(db_item)
    db.commit()
    return {"message": "Тирлист успешно создан", "tierlist_id": new_tl.id}

@app.get("/tierlists", response_model=List[schemas.TierListResponse])
def get_my_tier_lists(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_lists = db.query(TierList).filter(TierList.user_id == current_user.id).all()
    result = []
    for tl in user_lists:
        items = db.query(TierListItem, AnimeMetadata).outerjoin(
            AnimeMetadata, TierListItem.anime_id == AnimeMetadata.anime_id
        ).filter(TierListItem.tier_list_id == tl.id).order_by(TierListItem.position).all()
        
        result.append({
            "id": tl.id,
            "title": tl.title,
            "items": [
                {
                    "anime_id": i.TierListItem.anime_id,
                    "rank": i.TierListItem.rank,
                    "position": i.TierListItem.position,
                    "meta": {
                        "id": i.TierListItem.anime_id,
                        "title": i.AnimeMetadata.title if i.AnimeMetadata else f"Аниме #{i.TierListItem.anime_id}",
                        "image": i.AnimeMetadata.image if i.AnimeMetadata else "",
                        "url": i.AnimeMetadata.url if i.AnimeMetadata else ""
                    }
                } for i in items
            ]
        })
    return result

@app.get("/tierlists/{tierlist_id}", response_model=schemas.TierListResponse)
def get_tier_list(tierlist_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tl = db.query(TierList).filter(TierList.id == tierlist_id, TierList.user_id == current_user.id).first()
    if not tl:
        raise HTTPException(status_code=404, detail="Тирлист не найден")

    items = db.query(TierListItem, AnimeMetadata).outerjoin(
        AnimeMetadata, TierListItem.anime_id == AnimeMetadata.anime_id
    ).filter(TierListItem.tier_list_id == tl.id).order_by(TierListItem.position).all()

    return {
        "id": tl.id,
        "title": tl.title,
        "items": [
            {
                "anime_id": i.TierListItem.anime_id,
                "rank": i.TierListItem.rank,
                "position": i.TierListItem.position,
                "meta": {
                    "id": i.TierListItem.anime_id,
                    "title": i.AnimeMetadata.title if i.AnimeMetadata else f"Аниме #{i.TierListItem.anime_id}",
                    "image": i.AnimeMetadata.image if i.AnimeMetadata else "",
                    "url": i.AnimeMetadata.url if i.AnimeMetadata else ""
                }
            } for i in items
        ]
    }

@app.put("/tierlists/{tierlist_id}")
def update_tier_list(
    tierlist_id: int,
    tl_data: schemas.TierListCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tl = db.query(TierList).filter(TierList.id == tierlist_id, TierList.user_id == current_user.id).first()
    if not tl:
        raise HTTPException(status_code=404, detail="Тирлист не найден")

    tl.title = tl_data.title
    db.query(TierListItem).filter(TierListItem.tier_list_id == tl.id).delete()

    for item in tl_data.items:
        db_item = TierListItem(
            tier_list_id=tl.id,
            anime_id=item.anime_id,
            rank=item.rank,
            position=item.position
        )
        db.add(db_item)
    db.commit()
    return {"message": "Тирлист обновлён"}

@app.delete("/tierlists/{tierlist_id}", status_code=status.HTTP_200_OK)
def delete_tier_list(tierlist_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tl = db.query(TierList).filter(TierList.id == tierlist_id, TierList.user_id == current_user.id).first()
    if not tl:
        raise HTTPException(status_code=404, detail="Тирлист не найден")

    db.delete(tl)
    db.commit()
    return {"message": "Тирлист успешно удален"}

# состояние конкретного аниме для текущего пользователя (для кнопок на странице тайтла)
@app.get("/anime/interaction/{anime_id}")
def get_interaction(anime_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    interaction = db.query(UserAnimeInteraction).filter(
        UserAnimeInteraction.user_id == current_user.id,
        UserAnimeInteraction.anime_id == anime_id
    ).first()
    
    if not interaction:
        return {"is_favorite": False, "is_watched": False}
    return {"is_favorite": interaction.is_favorite, "is_watched": interaction.is_watched}

#ЭНДПОИНТЫ ПАРСЕРА ANIMEGO
#корневой эндпоинт
@app.get("/", tags=["Общее"])
def root():
    return {"message": "Anime Backend работает", "docs": "/docs"}

#Поиск
@app.get(
    "/search",
    response_model=list[SearchResult],
    summary="Поиск аниме по названию",
    tags=["Поиск"],
)
@cache(expire=30*60)
def search(
    query: str = Query(..., description="Поисковый запрос", min_length=1),
    parser: AnimegoParser = Depends(get_parser),
):
    try:
        results = parser.search(query=query)
        return results
    except Exception as e:
        return handle_parser_error(e)


#информация об аниме
@app.get(
    "/anime/info",
    response_model=AnimeInfo,
    summary="Полная информация об аниме",
    tags=["Аниме"],
)
@cache(expire=6*60*60)
def anime_info(
    url: str = Query(..., description="Ссылка на страницу аниме на AnimeGO"),
    parser: AnimegoParser = Depends(get_parser),
):

    try:
        info = parser.anime_info(url=url)
        return info
    except Exception as e:
        return handle_parser_error(e)


#получить id из ссылки
@app.get(
    "/anime/id-from-link",
    summary="Получить числовой ID аниме из ссылки",
    tags=["Аниме"],
)
def get_id_from_link(
    url: str = Query(..., description="Ссылка на страницу аниме"),
):

    try:
        anime_id = AnimegoParser.get_id_from_link(link=url)
        return {"id": anime_id}
    except Exception as e:
        return handle_parser_error(e)


#эпизоды
@app.get(
    "/anime/{anime_id}/episodes",
    response_model=list[EpisodeInfo],
    summary="Информация об эпизодах аниме",
    tags=["Эпизоды"],
)
@cache(expire=2*60*60)
def get_episodes(
    anime_id: str,
    parser: AnimegoParser = Depends(get_parser),
):

    try:
        episodes = parser.get_episodes_info(anime_id=anime_id)
        return episodes
    except Exception as e:
        return handle_parser_error(e)


#озвучки
@app.get(
    "/anime/{anime_id}/voices",
    response_model=VoicesResponse,
    summary="Доступные озвучки для эпизода",
    tags=["Плеер"],
)
def get_voices(
    anime_id: str,
    episode: int = Query(1, description="Номер эпизода (начиная с 1)", ge=1),
    parser: AnimegoParser = Depends(get_parser),
):

    try:
        voices_data = parser.get_voices(anime_id=anime_id, episode=episode)
        return voices_data
    except Exception as e:
        return handle_parser_error(e)


#стрим Aniboom по translation_id
@app.get(
    "/anime/{anime_id}/stream/aniboom",
    response_model=StreamResponse,
    summary="Получить поток Aniboom для озвучки",
    tags=["Плеер"],
)
def get_aniboom_stream(
    anime_id: str,
    translation_id: str = Query(..., description="translation_id из /voices"),
    episode: int = Query(1, description="Номер эпизода", ge=1),
    parser: AnimegoParser = Depends(get_parser),
):

    try:
        stream = parser.aniboom_get_stream_for_voice(
            translation_id=translation_id,
            episode=episode,
            anime_id=anime_id,
        )
        return stream
    except Exception as e:
        return handle_parser_error(e)


#стрим Aniboom по embed URL
@app.get(
    "/stream/aniboom/embed",
    response_model=StreamResponse,
    summary="Получить поток Aniboom по embed-ссылке",
    tags=["Плеер"],
)
def get_aniboom_stream_by_embed(
    embed_url: str = Query(..., description="Embed-ссылка из поля embed в /voices"),
    parser: AnimegoParser = Depends(get_parser),
):

    try:
        stream = parser.aniboom_get_stream(embed_url=embed_url)
        return stream
    except Exception as e:
        return handle_parser_error(e)


# CVH плейлист
@app.get(
    "/stream/cvh/playlist",
    summary="Получить плейлист CVH",
    tags=["Плеер"],
)
def get_cvh_playlist(
    cvh_id: str = Query(..., description="cvh_id из поля cvh_id в /voices"),
    parser: AnimegoParser = Depends(get_parser),
):
    try:
        playlist = parser.cvh_get_playlist(cvh_id=cvh_id)
        return playlist
    except Exception as e:
        return handle_parser_error(e)


#CVH стрим
@app.get(
    "/stream/cvh",
    response_model=CVHStreamResponse,
    summary="Получить поток CVH",
    tags=["Плеер"],
)
def get_cvh_stream(
    cvh_id: str = Query(..., description="cvh_id из поля cvh_id в /voices"),
    episode: int = Query(1, description="Номер эпизода", ge=1),
    season: int = Query(1, description="Номер сезона", ge=1),
    translation: str = Query(..., description="Название студии озвучки (fuzzy-поиск)"),
    parser: AnimegoParser = Depends(get_parser),
):
    try:
        stream = parser.cvh_get_stream(
            cvh_id=cvh_id,
            season=season,
            episode=episode,
            translation=translation,
        )
        return stream
    except Exception as e:
        return handle_parser_error(e)


#CVH стрим по vkId
@app.get(
    "/stream/cvh/by-vkid",
    response_model=CVHStreamResponse,
    summary="Получить поток CVH по vkId",
    tags=["Плеер"],
)
def get_cvh_stream_by_vkid(
    vk_id: str = Query(..., description="vkId из ответа /stream/cvh/playlist"),
    parser: AnimegoParser = Depends(get_parser),
):

    try:
        stream = parser.cvh_get_stream_by_id(vkId=vk_id)
        return stream
    except Exception as e:
        return handle_parser_error(e)

#расписание
@app.get(
    "/schedule",
    response_model=Schedule,
    summary="Расписание выхода аниме",
    tags=["Расписание"],
)
@cache(expire=60*60)
def get_schedule(
    parser: AnimegoParser = Depends(get_parser),
):
    try:
        schedule = parser.get_schedule()
        return schedule
    except Exception as e:
        return handle_parser_error(e)

#обновления
@app.get(
    "/updates",
    response_model=list[AnimeUpdate],
    summary="Последние обновления озвучек",
    tags=["Расписание"],
)
def get_anime_updates(
    parser: AnimegoParser = Depends(get_parser),
):

    try:
        updates = parser.get_anime_updates()
        return updates
    except Exception as e:
        return handle_parser_error(e)

#текущий сезон
@app.get(
    "/season/current",
    response_model=list[SeasonAnime],
    summary="Аниме текущего сезона",
    tags=["Расписание"],
)
@cache(expire=12*60*60)
def get_current_season(
    parser: AnimegoParser = Depends(get_parser),
):
    try:
        season = parser.get_anime_from_current_season()
        return season
    except Exception as e:
        return handle_parser_error(e)

#ЭНДПОИНТЫ ПАРСЕРА SHIKIMORI
@app.get(
    "/catalog",
    response_model=CatalogResponse,
    summary="Каталог всех аниме (через Shikimori)",
    tags=["Каталог"],
)

#получить каталог аниме
@cache(expire=60*60)
def get_catalog(
    page: int = Query(1, ge=1, description="Номер страницы"),
    page_size: int = Query(18, ge=1, le=50, description="Аниме на странице"),
    status: Optional[str] = Query(None, description=f"Статус: {', '.join(SHIKIMORI_STATUSES)}"),
    anime_type: Optional[str] = Query(None, description=f"Тип: {', '.join(SHIKIMORI_TYPES)}"),
    genre: Optional[str] = Query(None, description="Жанр (пример: 10-Fantasy)"),
    sort_by: str = Query("rating", description=f"Сортировка: {', '.join(SHIKIMORI_SORTS)}"),
    shiki_parser: ShikimoriParser = Depends(get_shikimori_parser),
):
    try:
        shiki_start_page = page
        pages_needed = 2

        status_list = [status] if status and status in SHIKIMORI_STATUSES else []
        type_list = [anime_type] if anime_type and anime_type in SHIKIMORI_TYPES else []
        genre_list = [genre] if genre and genre in SHIKIMORI_GENRES else []

        raw = shiki_parser.get_anime_list(
            status=status_list,
            anime_type=type_list,
            genres=genre_list,
            start_page=shiki_start_page,
            page_limit=pages_needed,
            sort_by=sort_by if sort_by in SHIKIMORI_SORTS else "rating",
        )

        if not raw:
            return CatalogResponse(
                items=[],
                page=page,
                page_size=page_size,
                has_next=False,
            )

        SHIKI_PAGE_SIZE = 18
        sliced = raw[:SHIKI_PAGE_SIZE]
        has_next = len(raw) > SHIKI_PAGE_SIZE

        items = []
        for anime in sliced:
            items.append(CatalogAnime(
                shikimori_id=str(anime.get("shikimori_id", "")),
                title=anime.get("title"),
                original_title=anime.get("original_title"),
                poster=anime.get("poster"),
                year=anime.get("year"),
                type=anime.get("type"),
                url=anime.get("url"),
            ))

        return CatalogResponse(
            items=items,
            page=page,
            page_size=SHIKI_PAGE_SIZE,
            has_next=has_next,
        )

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return handle_parser_error(e)

@app.get(
    "/catalog/genres",
    summary="Список доступных жанров для каталога",
    tags=["Каталог"],
)
def get_catalog_genres():
    return SHIKIMORI_GENRES


@app.get(
    "/catalog/filters",
    summary="Доступные значения фильтров каталога",
    tags=["Каталог"],
)
def get_catalog_filters():
    return {
        "statuses": {
            "ongoing": "Онгоинг",
            "anons": "Анонс",
            "released": "Вышло",
            "latest": "Вышло недавно",
        },
        "types": {
            "tv": "TV Сериал",
            "movie": "Фильм",
            "ova": "OVA",
            "ona": "ONA",
            "special": "Спецвыпуск",
        },
        "sorts": {
            "rating": "По рейтингу",
            "popularity": "По популярности",
            "name": "По алфавиту",
            "aired_on": "По дате выхода",
            "id_desc": "По ID",
        },
        "genres": SHIKIMORI_GENRES,
    }


@app.get(
    "/catalog/resolve-animego",
    response_model=AnimeGoLinkResult,
    summary="Найти страницу аниме на AnimeGo по оригинальному названию",
    tags=["Каталог"],
)

#ищет аниме с Shikimori на AnimeGo по оригинальному названию
@cache(expire=24 * 60 * 60)
def resolve_animego_link(
    original_title: str = Query(..., description="Оригинальное название аниме (английское)"),
    russian_title: Optional[str] = Query(None, description="Русское название (запасной вариант)"),
    parser: AnimegoParser = Depends(get_parser),
):
    try:
        search_query = original_title.strip()
        results = parser.search(query=search_query)

        if not results and russian_title:
            results = parser.search(query=russian_title.strip())

        if not results:
            return AnimeGoLinkResult(animego_url=None, animego_id=None, found=False)

        best_match = _find_best_match(results, original_title, russian_title)

        if not best_match:
            return AnimeGoLinkResult(animego_url=None, animego_id=None, found=False)

        return AnimeGoLinkResult(
            animego_url=best_match.get("link"),
            animego_id=best_match.get("id"),
            found=True,
        )

    except Exception as e:
        logger.warning("Ошибка resolve_animego_link для '%s': %s", original_title, e)
        return AnimeGoLinkResult(animego_url=None, animego_id=None, found=False)

#выбирает наилучшее совпадение из результатов поиска AnimeGo
def _find_best_match(
    results: list,
    original_title: str,
    russian_title: Optional[str] = None,
) -> Optional[dict]:
    if not results:
        return None

    original_lower = original_title.lower().strip()

    def score(item: dict) -> float:
        candidate_original = (item.get("original_title") or "").lower().strip()
        candidate_title = (item.get("title") or "").lower().strip()

        score_orig = difflib.SequenceMatcher(
            None, original_lower, candidate_original
        ).ratio()

        score_title = difflib.SequenceMatcher(
            None, original_lower, candidate_title
        ).ratio()

        score_ru = 0.0
        if russian_title:
            ru_lower = russian_title.lower().strip()
            score_ru = difflib.SequenceMatcher(
                None, ru_lower, candidate_title
            ).ratio() * 0.3

        return max(score_orig, score_title) + score_ru

    ranked = sorted(results, key=score, reverse=True)
    best = ranked[0]
    best_score = score(best)

    logger.debug(
        "Лучшее совпадение для '%s': '%s' (score=%.2f)",
        original_title,
        best.get("title"),
        best_score,
    )

    if best_score < 0.95:
        return None

    return best

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=DEBUG)
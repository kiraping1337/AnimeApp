from dotenv import load_dotenv
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

#настройки парсера AnimeGO
ANIMEGO_MIRROR = os.getenv("ANIMEGO_MIRROR", None)
ANIMEGO_PROXY = os.getenv("ANIMEGO_PROXY", None)
USE_LXML = os.getenv("USE_LXML", "false").lower() == "true"
USE_CACHE = os.getenv("USE_CACHE", "true").lower() == "true"
CACHE_MAXSIZE = int(os.getenv("CACHE_MAXSIZE", "300"))
CACHE_TTL = int(os.getenv("CACHE_TTL", "36000"))

#настройки парсера Shikimori
SHIKIMORI_MIRROR = os.getenv("SHIKIMORI_MIRROR", "shikimori.io")
CATALOG_PAGE_SIZE = int(os.getenv("CATALOG_PAGE_SIZE", "20"))

#настройки сервера
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

#настройки БД и JWT
DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
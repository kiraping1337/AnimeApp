from anime_parsers_ru import AnimegoParser, ShikimoriParser
from config import *

_animego_parser = AnimegoParser(
    mirror=ANIMEGO_MIRROR,
    proxy=ANIMEGO_PROXY,
    use_lxml=USE_LXML,
    use_cache=USE_CACHE,
    cache_maxsize=CACHE_MAXSIZE,
    cache_ttl=CACHE_TTL,
)

_shikimori_parser = ShikimoriParser(
    use_lxml=USE_LXML,
    graphql_mirror="shikimori.io",
    mirror=SHIKIMORI_MIRROR
)

def get_parser() -> AnimegoParser:
    return _animego_parser

def get_shikimori_parser() -> ShikimoriParser:
    return _shikimori_parser
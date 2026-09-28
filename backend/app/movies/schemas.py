from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class MovieCreate(BaseModel):
    titulo: str = Field(min_length=1, max_length=500)
    diretor: str = Field(min_length=1, max_length=255)
    ano_lancamento: int | None = Field(default=None, ge=1888, le=2100)
    generos: list[str] = Field(default_factory=list)
    sinopse: str | None = Field(default=None, max_length=4000)
    duracao_minutos: int | None = Field(default=None, ge=1, le=1000)
    url_poster: str | None = Field(default=None, max_length=2048)

    @field_validator("titulo", "diretor")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("O campo não pode ficar vazio")
        return value

    @field_validator("generos")
    @classmethod
    def normalize_genres(cls, values: list[str]) -> list[str]:
        result: list[str] = []
        seen: set[str] = set()
        for value in values:
            name = value.strip()
            key = name.casefold()
            if name and key not in seen:
                result.append(name)
                seen.add(key)
        return result

    @field_validator("sinopse", "url_poster")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class MovieUpdate(BaseModel):
    titulo: str | None = Field(default=None, min_length=1, max_length=500)
    diretor: str | None = Field(default=None, min_length=1, max_length=255)
    ano_lancamento: int | None = Field(default=None, ge=1888, le=2100)
    generos: list[str] | None = None
    sinopse: str | None = Field(default=None, max_length=4000)
    duracao_minutos: int | None = Field(default=None, ge=1, le=1000)
    url_poster: str | None = Field(default=None, max_length=2048)

    @field_validator("titulo", "diretor")
    @classmethod
    def strip_required_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("O campo não pode ficar vazio")
        return value

    @field_validator("generos")
    @classmethod
    def normalize_genres(cls, values: list[str] | None) -> list[str] | None:
        if values is None:
            return None
        result: list[str] = []
        seen: set[str] = set()
        for value in values:
            name = value.strip()
            key = name.casefold()
            if name and key not in seen:
                result.append(name)
                seen.add(key)
        return result

    @field_validator("sinopse", "url_poster")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class ReviewCreate(BaseModel):
    nome: str = Field(default="Administrador", min_length=1, max_length=120)
    nota: float = Field(ge=1, le=5)
    comentario: str = Field(min_length=1, max_length=4000)

    @field_validator("nome", "comentario")
    @classmethod
    def strip_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("O campo não pode ficar vazio")
        return value


class ReviewResponse(BaseModel):
    id: str
    nome: str
    nota: float
    comentario: str
    created_at: datetime


class MovieListItem(BaseModel):
    id: str
    titulo: str
    diretor: str | None
    ano_lancamento: int | None
    generos: list[str]
    sinopse: str | None
    duracao_minutos: int | None
    url_poster: str | None
    media_avaliacoes: float | None
    total_avaliacoes: int


class MovieDetail(MovieListItem):
    reviews: list[ReviewResponse]


class MoviePage(BaseModel):
    items: list[MovieListItem]
    page: int
    page_size: int
    total: int
    total_pages: int

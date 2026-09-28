from math import ceil
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.movies.models import DimGenre, DimMovie, DimPerson, MovieReview
from app.movies.schemas import (
    MovieCreate,
    MovieDetail,
    MovieListItem,
    MoviePage,
    MovieUpdate,
    ReviewCreate,
    ReviewResponse,
)

router = APIRouter()


def movie_load_options():
    return (
        selectinload(DimMovie.genres),
        selectinload(DimMovie.people),
        selectinload(DimMovie.reviews),
    )


def movie_to_list_item(movie: DimMovie) -> MovieListItem:
    directors = [person.nome_pessoa for person in movie.people if person.tipo_pessoa == "Diretor"]
    ratings = [review.nota for review in movie.reviews]
    average = round(sum(ratings) / len(ratings), 2) if ratings else None

    return MovieListItem(
        id=movie.sk_movie_id,
        titulo=movie.titulo,
        diretor=directors[0] if directors else None,
        ano_lancamento=movie.ano_lancamento,
        generos=[genre.nome_genero for genre in movie.genres],
        sinopse=movie.sinopse,
        duracao_minutos=movie.duracao_minutos,
        url_poster=movie.url_poster,
        media_avaliacoes=average,
        total_avaliacoes=len(ratings),
    )


def movie_to_detail(movie: DimMovie) -> MovieDetail:
    base = movie_to_list_item(movie)
    reviews = [
        ReviewResponse(
            id=review.sk_movie_review_id,
            nome=review.nome,
            nota=review.nota,
            comentario=review.comentario,
            created_at=review.created_at,
        )
        for review in sorted(movie.reviews, key=lambda item: item.created_at, reverse=True)
    ]
    return MovieDetail(**base.model_dump(), reviews=reviews)


async def load_movie(db: AsyncSession, movie_id: str) -> DimMovie:
    query = select(DimMovie).where(DimMovie.sk_movie_id == movie_id).options(*movie_load_options())
    movie = (await db.execute(query)).scalar_one_or_none()
    if movie is None:
        raise HTTPException(status_code=404, detail="Filme não encontrado")
    return movie


async def get_or_create_genre(db: AsyncSession, name: str) -> DimGenre:
    query = select(DimGenre).where(func.lower(DimGenre.nome_genero) == name.lower())
    genre = (await db.execute(query)).scalar_one_or_none()
    if genre is None:
        genre = DimGenre(nome_genero=name)
        db.add(genre)
    return genre


async def get_or_create_director(db: AsyncSession, name: str) -> DimPerson:
    query = select(DimPerson).where(
        func.lower(DimPerson.nome_pessoa) == name.lower(),
        DimPerson.tipo_pessoa == "Diretor",
    )
    director = (await db.execute(query)).scalar_one_or_none()
    if director is None:
        director = DimPerson(nome_pessoa=name, tipo_pessoa="Diretor")
        db.add(director)
    return director


@router.get("", response_model=MoviePage)
async def list_movies(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=50),
    search: str | None = Query(default=None, max_length=200),
    db: AsyncSession = Depends(get_db),
) -> MoviePage:
    filters = []
    if search and search.strip():
        term = f"%{search.strip()}%"
        filters.append(
            or_(
                DimMovie.titulo.ilike(term),
                DimMovie.people.any(DimPerson.nome_pessoa.ilike(term)),
                DimMovie.genres.any(DimGenre.nome_genero.ilike(term)),
            )
        )

    count_query = select(func.count()).select_from(DimMovie)
    movies_query = select(DimMovie).options(*movie_load_options()).order_by(DimMovie.titulo)

    if filters:
        count_query = count_query.where(*filters)
        movies_query = movies_query.where(*filters)

    total = (await db.execute(count_query)).scalar_one()
    offset = (page - 1) * page_size
    movies_query = movies_query.offset(offset).limit(page_size)
    movies = (await db.execute(movies_query)).scalars().unique().all()

    return MoviePage(
        items=[movie_to_list_item(movie) for movie in movies],
        page=page,
        page_size=page_size,
        total=total,
        total_pages=ceil(total / page_size) if total else 0,
    )


@router.get("/{movie_id}", response_model=MovieDetail)
async def get_movie(movie_id: str, db: AsyncSession = Depends(get_db)) -> MovieDetail:
    movie = await load_movie(db, movie_id)
    return movie_to_detail(movie)


@router.post("", response_model=MovieDetail, status_code=status.HTTP_201_CREATED)
async def create_movie(payload: MovieCreate, db: AsyncSession = Depends(get_db)) -> MovieDetail:
    genres = [await get_or_create_genre(db, name) for name in payload.generos]
    director = await get_or_create_director(db, payload.diretor)

    movie = DimMovie(
        id_filme=f"manual-{uuid4().hex[:16]}",
        titulo=payload.titulo,
        ano_lancamento=payload.ano_lancamento,
        sinopse=payload.sinopse,
        duracao_minutos=payload.duracao_minutos,
        url_poster=payload.url_poster,
        status_filme="Cadastrado",
        genres=genres,
        people=[director],
    )
    db.add(movie)
    await db.commit()

    movie = await load_movie(db, movie.sk_movie_id)
    return movie_to_detail(movie)


@router.put("/{movie_id}", response_model=MovieDetail)
async def update_movie(
    movie_id: str,
    payload: MovieUpdate,
    db: AsyncSession = Depends(get_db),
) -> MovieDetail:
    movie = await load_movie(db, movie_id)
    changes = payload.model_dump(exclude_unset=True)

    if "titulo" in changes:
        movie.titulo = changes["titulo"]
    if "ano_lancamento" in changes:
        movie.ano_lancamento = changes["ano_lancamento"]
    if "sinopse" in changes:
        movie.sinopse = changes["sinopse"]
    if "duracao_minutos" in changes:
        movie.duracao_minutos = changes["duracao_minutos"]
    if "url_poster" in changes:
        movie.url_poster = changes["url_poster"]

    if "generos" in changes:
        movie.genres = [await get_or_create_genre(db, name) for name in changes["generos"]]

    if "diretor" in changes:
        director = await get_or_create_director(db, changes["diretor"])
        other_people = [person for person in movie.people if person.tipo_pessoa != "Diretor"]
        movie.people = [*other_people, director]

    await db.commit()
    movie = await load_movie(db, movie_id)
    return movie_to_detail(movie)


@router.delete("/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_movie(movie_id: str, db: AsyncSession = Depends(get_db)) -> Response:
    movie = await load_movie(db, movie_id)
    await db.delete(movie)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{movie_id}/reviews", response_model=MovieDetail, status_code=status.HTTP_201_CREATED)
async def create_review(
    movie_id: str,
    payload: ReviewCreate,
    db: AsyncSession = Depends(get_db),
) -> MovieDetail:
    movie = await load_movie(db, movie_id)
    review = MovieReview(
        movie=movie,
        nome=payload.nome,
        nota=payload.nota,
        comentario=payload.comentario,
    )
    db.add(review)
    await db.commit()

    movie = await load_movie(db, movie_id)
    return movie_to_detail(movie)

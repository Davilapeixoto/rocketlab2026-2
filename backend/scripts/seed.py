import asyncio

from sqlalchemy import func, select

from app.db.session import AsyncSessionLocal
from app.movies.models import DimGenre, DimMovie, DimPerson, MovieReview

MOVIES = [
    {
        "id_filme": "demo-001",
        "titulo": "A Chegada",
        "diretor": "Denis Villeneuve",
        "ano_lancamento": 2016,
        "generos": ["Ficção científica", "Drama"],
        "duracao_minutos": 116,
        "sinopse": "Uma linguista é chamada para tentar se comunicar com visitantes extraterrestres após misteriosas naves surgirem em diferentes pontos do planeta.",
    },
    {
        "id_filme": "demo-002",
        "titulo": "Parasita",
        "diretor": "Bong Joon-ho",
        "ano_lancamento": 2019,
        "generos": ["Drama", "Suspense"],
        "duracao_minutos": 132,
        "sinopse": "Uma família com dificuldades financeiras encontra uma oportunidade de se aproximar de uma família rica, com consequências inesperadas.",
    },
    {
        "id_filme": "demo-003",
        "titulo": "Whiplash",
        "diretor": "Damien Chazelle",
        "ano_lancamento": 2014,
        "generos": ["Drama", "Música"],
        "duracao_minutos": 107,
        "sinopse": "Um jovem baterista entra em um conservatório de música e passa a ser pressionado por um professor conhecido por seus métodos extremos.",
    },
    {
        "id_filme": "demo-004",
        "titulo": "O Grande Hotel Budapeste",
        "diretor": "Wes Anderson",
        "ano_lancamento": 2014,
        "generos": ["Comédia", "Aventura"],
        "duracao_minutos": 99,
        "sinopse": "Um concierge e seu jovem ajudante se envolvem em uma disputa por uma valiosa pintura enquanto a Europa passa por grandes mudanças.",
    },
    {
        "id_filme": "demo-005",
        "titulo": "Mad Max: Estrada da Fúria",
        "diretor": "George Miller",
        "ano_lancamento": 2015,
        "generos": ["Ação", "Aventura"],
        "duracao_minutos": 120,
        "sinopse": "Em um mundo devastado, Max se junta a Furiosa e a um grupo de fugitivas em uma perseguição pelo deserto.",
    },
    {
        "id_filme": "demo-006",
        "titulo": "Interestelar",
        "diretor": "Christopher Nolan",
        "ano_lancamento": 2014,
        "generos": ["Ficção científica", "Aventura"],
        "duracao_minutos": 169,
        "sinopse": "Exploradores atravessam um buraco de minhoca em busca de um novo lar para a humanidade enquanto a Terra enfrenta uma crise ambiental.",
    },
    {
        "id_filme": "demo-007",
        "titulo": "O Labirinto do Fauno",
        "diretor": "Guillermo del Toro",
        "ano_lancamento": 2006,
        "generos": ["Fantasia", "Drama"],
        "duracao_minutos": 118,
        "sinopse": "Na Espanha de 1944, uma garota encontra um misterioso labirinto e passa a cumprir tarefas apresentadas por uma criatura fantástica.",
    },
    {
        "id_filme": "demo-008",
        "titulo": "Blade Runner 2049",
        "diretor": "Denis Villeneuve",
        "ano_lancamento": 2017,
        "generos": ["Ficção científica", "Suspense"],
        "duracao_minutos": 164,
        "sinopse": "Um novo blade runner descobre um segredo capaz de abalar o que resta da sociedade e inicia uma busca por Rick Deckard.",
    },
]


async def get_or_create_genre(session, name: str) -> DimGenre:
    genre = (
        await session.execute(select(DimGenre).where(func.lower(DimGenre.nome_genero) == name.lower()))
    ).scalar_one_or_none()
    if genre is None:
        genre = DimGenre(nome_genero=name)
        session.add(genre)
        await session.flush()
    return genre


async def get_or_create_director(session, name: str) -> DimPerson:
    director = (
        await session.execute(
            select(DimPerson).where(
                func.lower(DimPerson.nome_pessoa) == name.lower(),
                DimPerson.tipo_pessoa == "Diretor",
            )
        )
    ).scalar_one_or_none()
    if director is None:
        director = DimPerson(nome_pessoa=name, tipo_pessoa="Diretor")
        session.add(director)
        await session.flush()
    return director


async def main() -> None:
    async with AsyncSessionLocal() as session:
        count = (await session.execute(select(func.count()).select_from(DimMovie))).scalar_one()
        if count:
            print("O banco já possui filmes. Nenhum dado foi alterado.")
            return

        created: list[DimMovie] = []
        for item in MOVIES:
            genres = [await get_or_create_genre(session, name) for name in item["generos"]]
            director = await get_or_create_director(session, item["diretor"])
            movie = DimMovie(
                id_filme=item["id_filme"],
                titulo=item["titulo"],
                ano_lancamento=item["ano_lancamento"],
                duracao_minutos=item["duracao_minutos"],
                sinopse=item["sinopse"],
                status_filme="Cadastrado",
                genres=genres,
                people=[director],
            )
            session.add(movie)
            created.append(movie)

        await session.flush()
        session.add_all(
            [
                MovieReview(
                    sk_movie_id=created[0].sk_movie_id,
                    nome="Administrador",
                    nota=5,
                    comentario="Ótima ficção científica, principalmente pela forma como trabalha linguagem e tempo.",
                ),
                MovieReview(
                    sk_movie_id=created[1].sk_movie_id,
                    nome="Administrador",
                    nota=5,
                    comentario="História muito bem construída e com mudanças de tom que funcionam do começo ao fim.",
                ),
                MovieReview(
                    sk_movie_id=created[2].sk_movie_id,
                    nome="Administrador",
                    nota=4,
                    comentario="Tenso e direto, com atuações que sustentam o conflito central.",
                ),
            ]
        )
        await session.commit()
        print(f"{len(created)} filmes cadastrados.")


if __name__ == "__main__":
    asyncio.run(main())

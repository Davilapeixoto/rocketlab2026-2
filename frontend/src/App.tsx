import { FormEvent, useEffect, useState } from 'react'
import {
  createMovie,
  createReview,
  deleteMovie,
  getMovie,
  getMovies,
  updateMovie,
} from './api'
import type { Movie, MovieDetail, MoviePage, MoviePayload } from './types'

const emptyPage: MoviePage = {
  items: [],
  page: 1,
  page_size: 12,
  total: 0,
  total_pages: 0,
}

function Stars({ value }: { value: number | null }) {
  if (value === null) return <span className="no-rating">Sem avaliações</span>
  const rounded = Math.round(value)
  return (
    <span className="stars" aria-label={`${value} de 5 estrelas`}>
      {'★'.repeat(rounded)}{'☆'.repeat(5 - rounded)} <strong>{value.toFixed(1)}</strong>
    </span>
  )
}

function MovieCard({ movie, onOpen }: { movie: Movie; onOpen: (movie: Movie) => void }) {
  return (
    <button className="movie-card" type="button" onClick={() => onOpen(movie)}>
      <div className="poster">
        {movie.url_poster ? (
          <img src={movie.url_poster} alt={`Pôster de ${movie.titulo}`} />
        ) : (
          <div className="poster-placeholder"><span>{movie.titulo.slice(0, 1)}</span></div>
        )}
        <div className="poster-rating">
          {movie.media_avaliacoes !== null ? `★ ${movie.media_avaliacoes.toFixed(1)}` : 'Novo'}
        </div>
      </div>
      <div className="card-body">
        <h2>{movie.titulo}</h2>
        <p className="movie-meta">
          {movie.ano_lancamento ?? 'Ano não informado'}
          {movie.diretor ? ` · ${movie.diretor}` : ''}
        </p>
        <p className="genre-line">{movie.generos.length ? movie.generos.join(' · ') : 'Sem gênero'}</p>
      </div>
    </button>
  )
}

function MovieForm({
  movie,
  onClose,
  onSaved,
}: {
  movie?: MovieDetail
  onClose: () => void
  onSaved: (movie: MovieDetail) => void
}) {
  const [title, setTitle] = useState(movie?.titulo ?? '')
  const [director, setDirector] = useState(movie?.diretor ?? '')
  const [year, setYear] = useState(movie?.ano_lancamento?.toString() ?? '')
  const [genres, setGenres] = useState(movie?.generos.join(', ') ?? '')
  const [duration, setDuration] = useState(movie?.duracao_minutos?.toString() ?? '')
  const [poster, setPoster] = useState(movie?.url_poster ?? '')
  const [synopsis, setSynopsis] = useState(movie?.sinopse ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload: MoviePayload = {
      titulo: title.trim(),
      diretor: director.trim(),
      ano_lancamento: year ? Number(year) : null,
      generos: genres.split(',').map((item) => item.trim()).filter(Boolean),
      sinopse: synopsis.trim() || null,
      duracao_minutos: duration ? Number(duration) : null,
      url_poster: poster.trim() || null,
    }

    try {
      const saved = movie ? await updateMovie(movie.id, payload) : await createMovie(payload)
      onSaved(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar o filme.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal form-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">Catálogo</span>
            <h2>{movie ? 'Editar filme' : 'Cadastrar filme'}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Fechar">×</button>
        </div>

        <form className="movie-form" onSubmit={handleSubmit}>
          <label className="field wide">
            <span>Título</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={500} />
          </label>

          <label className="field">
            <span>Diretor</span>
            <input value={director} onChange={(event) => setDirector(event.target.value)} required maxLength={255} />
          </label>

          <label className="field">
            <span>Ano de lançamento</span>
            <input type="number" min="1888" max="2100" value={year} onChange={(event) => setYear(event.target.value)} />
          </label>

          <label className="field wide">
            <span>Gêneros</span>
            <input
              value={genres}
              onChange={(event) => setGenres(event.target.value)}
              placeholder="Drama, Ficção científica, Aventura"
            />
            <small>Separe os gêneros por vírgula.</small>
          </label>

          <label className="field">
            <span>Duração (minutos)</span>
            <input type="number" min="1" max="1000" value={duration} onChange={(event) => setDuration(event.target.value)} />
          </label>

          <label className="field">
            <span>URL do pôster</span>
            <input type="url" value={poster} onChange={(event) => setPoster(event.target.value)} placeholder="https://..." />
          </label>

          <label className="field wide">
            <span>Sinopse</span>
            <textarea value={synopsis} onChange={(event) => setSynopsis(event.target.value)} rows={5} maxLength={4000} />
          </label>

          {error && <p className="form-error wide">{error}</p>}

          <div className="form-actions wide">
            <button className="button secondary" type="button" onClick={onClose}>Cancelar</button>
            <button className="button primary" type="submit" disabled={saving}>
              {saving ? 'Salvando...' : movie ? 'Salvar alterações' : 'Cadastrar filme'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MovieDetails({
  movie,
  onClose,
  onEdit,
  onDelete,
  onReviewAdded,
}: {
  movie: MovieDetail
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onReviewAdded: (movie: MovieDetail) => void
}) {
  const [name, setName] = useState('Administrador')
  const [rating, setRating] = useState('5')
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function submitReview(event: FormEvent) {
    event.preventDefault()
    setSending(true)
    setError('')
    try {
      const updated = await createReview(movie.id, {
        nome: name.trim(),
        nota: Number(rating),
        comentario: comment.trim(),
      })
      setComment('')
      setRating('5')
      onReviewAdded(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar avaliação.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal detail-modal" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button close-detail" type="button" onClick={onClose} aria-label="Fechar">×</button>

        <div className="detail-grid">
          <div className="detail-poster poster">
            {movie.url_poster ? (
              <img src={movie.url_poster} alt={`Pôster de ${movie.titulo}`} />
            ) : (
              <div className="poster-placeholder"><span>{movie.titulo.slice(0, 1)}</span></div>
            )}
          </div>

          <div className="detail-content">
            <span className="eyebrow">{movie.generos.join(' · ') || 'Catálogo'}</span>
            <h2>{movie.titulo}</h2>
            <p className="detail-meta">
              {movie.ano_lancamento ?? 'Ano não informado'}
              {movie.diretor ? ` · Direção de ${movie.diretor}` : ''}
              {movie.duracao_minutos ? ` · ${movie.duracao_minutos} min` : ''}
            </p>
            <Stars value={movie.media_avaliacoes} />
            <p className="review-count">
              {movie.total_avaliacoes} {movie.total_avaliacoes === 1 ? 'avaliação' : 'avaliações'}
            </p>
            <p className="synopsis">{movie.sinopse || 'Nenhuma sinopse cadastrada.'}</p>

            <div className="detail-actions">
              <button className="button secondary" type="button" onClick={onEdit}>Editar</button>
              <button className="button danger" type="button" onClick={onDelete}>Remover</button>
            </div>
          </div>
        </div>

        <div className="reviews-area">
          <section className="review-form-section">
            <div className="section-heading">
              <span className="eyebrow">Nova avaliação</span>
              <h3>Adicionar nota e resenha</h3>
            </div>
            <form className="review-form" onSubmit={submitReview}>
              <label className="field">
                <span>Nome</span>
                <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} />
              </label>
              <label className="field rating-field">
                <span>Nota</span>
                <select value={rating} onChange={(event) => setRating(event.target.value)}>
                  <option value="5">5 estrelas</option>
                  <option value="4">4 estrelas</option>
                  <option value="3">3 estrelas</option>
                  <option value="2">2 estrelas</option>
                  <option value="1">1 estrela</option>
                </select>
              </label>
              <label className="field wide">
                <span>Resenha</span>
                <textarea value={comment} onChange={(event) => setComment(event.target.value)} required rows={4} maxLength={4000} />
              </label>
              {error && <p className="form-error wide">{error}</p>}
              <div className="wide">
                <button className="button primary" type="submit" disabled={sending}>
                  {sending ? 'Publicando...' : 'Publicar avaliação'}
                </button>
              </div>
            </form>
          </section>

          <section className="review-list-section">
            <div className="section-heading">
              <span className="eyebrow">Histórico</span>
              <h3>Avaliações</h3>
            </div>
            <div className="review-list">
              {movie.reviews.length === 0 ? (
                <div className="empty-reviews">Este filme ainda não recebeu avaliações.</div>
              ) : (
                movie.reviews.map((review) => (
                  <article className="review-item" key={review.id}>
                    <div className="review-topline">
                      <strong>{review.nome}</strong>
                      <span className="stars compact">{'★'.repeat(Math.round(review.nota))}</span>
                    </div>
                    <p>{review.comentario}</p>
                    <time>{new Date(review.created_at).toLocaleDateString('pt-BR')}</time>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [catalog, setCatalog] = useState<MoviePage>(emptyPage)
  const [search, setSearch] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [selected, setSelected] = useState<MovieDetail | null>(null)
  const [formMovie, setFormMovie] = useState<MovieDetail | null | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadCatalog(page = 1, term = activeSearch) {
    setLoading(true)
    setError('')
    try {
      setCatalog(await getMovies(page, term))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o catálogo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCatalog(1, '')
  }, [])

  async function openMovie(movie: Movie) {
    try {
      setSelected(await getMovie(movie.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao abrir o filme.')
    }
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    const term = search.trim()
    setActiveSearch(term)
    void loadCatalog(1, term)
  }

  function clearSearch() {
    setSearch('')
    setActiveSearch('')
    void loadCatalog(1, '')
  }

  function savedMovie(movie: MovieDetail) {
    setFormMovie(undefined)
    setSelected(movie)
    void loadCatalog(catalog.page, activeSearch)
  }

  async function removeSelected() {
    if (!selected) return
    const confirmed = window.confirm(`Remover “${selected.titulo}” do catálogo?`)
    if (!confirmed) return

    try {
      await deleteMovie(selected.id)
      setSelected(null)
      await loadCatalog(catalog.page, activeSearch)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover o filme.')
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><i></i><i></i><i></i></span>
          <span>CineTrack</span>
        </div>
        <button className="button primary" type="button" onClick={() => setFormMovie(null)}>
          + Novo filme
        </button>
      </header>

      <main>
        <section className="hero">
          <div>
            <span className="eyebrow">Painel do administrador</span>
            <h1>Seu catálogo de filmes,<br />organizado em um só lugar.</h1>
            <p>Cadastre títulos, consulte avaliações e mantenha sua coleção sempre atualizada.</p>
          </div>

          <form className="search-box" onSubmit={submitSearch}>
            <span aria-hidden="true">⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por título, diretor ou gênero"
              aria-label="Buscar filmes"
            />
            {search && <button type="button" className="clear-search" onClick={clearSearch}>×</button>}
            <button className="search-button" type="submit">Buscar</button>
          </form>
        </section>

        <section className="catalog-section">
          <div className="catalog-heading">
            <div>
              <span className="eyebrow">Catálogo</span>
              <h2>{activeSearch ? `Resultados para “${activeSearch}”` : 'Filmes cadastrados'}</h2>
            </div>
            <span className="catalog-count">{catalog.total} {catalog.total === 1 ? 'filme' : 'filmes'}</span>
          </div>

          {error && <div className="page-error">{error}</div>}

          {loading ? (
            <div className="loading-grid">
              {Array.from({ length: 8 }).map((_, index) => <div className="skeleton" key={index} />)}
            </div>
          ) : catalog.items.length ? (
            <div className="movie-grid">
              {catalog.items.map((movie) => <MovieCard movie={movie} onOpen={openMovie} key={movie.id} />)}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">◎</div>
              <h3>Nenhum filme encontrado</h3>
              <p>{activeSearch ? 'Tente uma busca diferente.' : 'Cadastre o primeiro filme para começar.'}</p>
              {activeSearch ? (
                <button className="button secondary" type="button" onClick={clearSearch}>Limpar busca</button>
              ) : (
                <button className="button primary" type="button" onClick={() => setFormMovie(null)}>Cadastrar filme</button>
              )}
            </div>
          )}

          {catalog.total_pages > 1 && (
            <nav className="pagination" aria-label="Paginação do catálogo">
              <button
                className="button secondary"
                type="button"
                disabled={catalog.page <= 1}
                onClick={() => void loadCatalog(catalog.page - 1)}
              >
                Anterior
              </button>
              <span>Página {catalog.page} de {catalog.total_pages}</span>
              <button
                className="button secondary"
                type="button"
                disabled={catalog.page >= catalog.total_pages}
                onClick={() => void loadCatalog(catalog.page + 1)}
              >
                Próxima
              </button>
            </nav>
          )}
        </section>
      </main>

      <footer>
        <span>CineTrack</span>
        <span>Sistema de avaliação de filmes</span>
      </footer>

      {selected && (
        <MovieDetails
          movie={selected}
          onClose={() => setSelected(null)}
          onEdit={() => setFormMovie(selected)}
          onDelete={() => void removeSelected()}
          onReviewAdded={(movie) => {
            setSelected(movie)
            void loadCatalog(catalog.page, activeSearch)
          }}
        />
      )}

      {formMovie !== undefined && (
        <MovieForm
          movie={formMovie ?? undefined}
          onClose={() => setFormMovie(undefined)}
          onSaved={savedMovie}
        />
      )}
    </div>
  )
}

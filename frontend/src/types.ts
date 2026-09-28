export type Review = {
  id: string
  nome: string
  nota: number
  comentario: string
  created_at: string
}

export type Movie = {
  id: string
  titulo: string
  diretor: string | null
  ano_lancamento: number | null
  generos: string[]
  sinopse: string | null
  duracao_minutos: number | null
  url_poster: string | null
  media_avaliacoes: number | null
  total_avaliacoes: number
}

export type MovieDetail = Movie & {
  reviews: Review[]
}

export type MoviePage = {
  items: Movie[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export type MoviePayload = {
  titulo: string
  diretor: string
  ano_lancamento: number | null
  generos: string[]
  sinopse: string | null
  duracao_minutos: number | null
  url_poster: string | null
}

export type ReviewPayload = {
  nome: string
  nota: number
  comentario: string
}

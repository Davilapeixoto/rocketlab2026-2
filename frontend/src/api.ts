import type { MovieDetail, MoviePage, MoviePayload, ReviewPayload } from './types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    let message = 'Não foi possível concluir a operação.'
    try {
      const body = await response.json()
      if (typeof body.detail === 'string') message = body.detail
    } catch {
      message = 'Não foi possível concluir a operação.'
    }
    throw new Error(message)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function getMovies(page = 1, search = '') {
  const params = new URLSearchParams({ page: String(page), page_size: '12' })
  if (search.trim()) params.set('search', search.trim())
  return request<MoviePage>(`/movies?${params.toString()}`)
}

export function getMovie(id: string) {
  return request<MovieDetail>(`/movies/${id}`)
}

export function createMovie(payload: MoviePayload) {
  return request<MovieDetail>('/movies', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateMovie(id: string, payload: MoviePayload) {
  return request<MovieDetail>(`/movies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteMovie(id: string) {
  return request<void>(`/movies/${id}`, { method: 'DELETE' })
}

export function createReview(id: string, payload: ReviewPayload) {
  return request<MovieDetail>(`/movies/${id}/reviews`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

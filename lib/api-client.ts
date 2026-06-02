// Lightweight API client for the browser
// All page mutations go through this so we get:
//   - consistent error handling
//   - a single point to inject the auth token
//   - easy swap to a real backend later (just change baseUrl)

const BASE = ''

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('equihub_token')
}

async function request<T>(method: string, path: string, body?: any, isForm?: boolean): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  let payload: BodyInit | undefined
  if (body !== undefined) {
    if (isForm) {
      payload = body
    } else {
      headers['Content-Type'] = 'application/json'
      payload = JSON.stringify(body)
    }
  }
  const res = await fetch(BASE + path, { method, headers, body: payload })
  const text = await res.text()
  const data = text ? safeParse(text) : null
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`
    throw new ApiError(msg, res.status, data)
  }
  return data as T
}

function safeParse(s: string): any {
  try { return JSON.parse(s) } catch { return s }
}

export class ApiError extends Error {
  status: number
  data: any
  constructor(message: string, status: number, data: any) {
    super(message)
    this.status = status
    this.data = data
  }
}

export const api = {
  get:    <T = any>(p: string)                 => request<T>('GET', p),
  post:   <T = any>(p: string, body?: any)     => request<T>('POST', p, body),
  put:    <T = any>(p: string, body?: any)     => request<T>('PUT', p, body),
  patch:  <T = any>(p: string, body?: any)     => request<T>('PATCH', p, body),
  delete: <T = any>(p: string)                 => request<T>('DELETE', p),
  upload: <T = any>(p: string, form: FormData) => request<T>('POST', p, form, true),
}

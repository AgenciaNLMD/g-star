// Cliente HTTP para llamadas desde componentes cliente a /api/*
async function request(method, url, data) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  }
  if (data !== undefined) options.body = JSON.stringify(data)

  const res = await fetch(url, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `Error ${res.status}`)
  }
  return res.json()
}

export const api = {
  get:   (url) => request("GET", url),
  post:  (url, data) => request("POST", url, data),
  put:   (url, data) => request("PUT", url, data),
  patch: (url, data) => request("PATCH", url, data),
  del:   (url) => request("DELETE", url),
}

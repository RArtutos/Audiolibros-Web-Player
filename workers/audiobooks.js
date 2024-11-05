addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const params = new URLSearchParams(url.search)
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    })
  }

  // Get the data from KV or fetch from source
  const data = await AUDIOBOOKS.get('consolidated_data', { type: 'json' })
  
  if (!data) {
    return new Response('Data not found', { status: 404 })
  }

  const query = params.get('q')?.toLowerCase() || ''
  const filter = params.get('filter') || 'all'
  const page = parseInt(params.get('page') || '1')
  const limit = parseInt(params.get('limit') || '20')

  let results = Object.entries(data)

  if (query) {
    results = results.filter(([_, book]) => {
      switch (filter) {
        case 'title':
          return book.title.toLowerCase().includes(query)
        case 'author':
          return book.authors.some(author => 
            (typeof author === 'string' ? author : author.name)
              .toLowerCase().includes(query)
          )
        case 'narrator':
          return book.narrators.some(narrator => 
            (typeof narrator === 'string' ? narrator : narrator.name)
              .toLowerCase().includes(query)
          )
        case 'genre':
          return book.genres.some(genre => 
            genre.toLowerCase().includes(query)
          )
        default:
          return (
            book.title.toLowerCase().includes(query) ||
            book.authors.some(author => 
              (typeof author === 'string' ? author : author.name)
                .toLowerCase().includes(query)
            ) ||
            book.narrators.some(narrator => 
              (typeof narrator === 'string' ? narrator : narrator.name)
                .toLowerCase().includes(query)
            ) ||
            book.genres.some(genre => 
              genre.toLowerCase().includes(query)
            )
          )
      }
    })
  }

  // Pagination
  const start = (page - 1) * limit
  const paginatedResults = results.slice(start, start + limit)
  const total = results.length

  const response = {
    data: Object.fromEntries(paginatedResults),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  return new Response(JSON.stringify(response), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  })
}
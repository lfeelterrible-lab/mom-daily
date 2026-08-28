const HTML_TYPES = new Set(['text/html', 'application/xhtml+xml']);

function requestForPath(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  return new Request(url, request);
}

function acceptsHtml(request) {
  const accept = request.headers.get('accept') ?? '';
  return accept.includes('*/*') || accept.split(',').some((value) => HTML_TYPES.has(value.split(';')[0].trim()));
}

function candidatesFor(pathname) {
  if (pathname === '/') return ['/index.html'];

  const candidates = [pathname];
  const withoutTrailingSlash = pathname.replace(/\/$/, '');

  if (pathname.endsWith('/')) {
    candidates.push(`${pathname}index.html`);
    if (!withoutTrailingSlash.includes('.')) candidates.push(`${withoutTrailingSlash}.html`);
  } else if (!pathname.includes('.')) {
    candidates.push(`${pathname}.html`);
  }

  return candidates;
}

export default {
  async fetch(request, env) {
    if (!env.ASSETS) {
      return new Response('MomDaily assets are not configured.', { status: 500 });
    }

    const url = new URL(request.url);
    let pathname = decodeURIComponent(url.pathname || '/').replace(/\/+/g, '/');
    if (!pathname.startsWith('/')) pathname = `/${pathname}`;

    let response;
    for (const candidate of candidatesFor(pathname)) {
      response = await env.ASSETS.fetch(requestForPath(request, candidate));
      if (response.status !== 404) return response;
    }

    if (acceptsHtml(request) && (request.method === 'GET' || request.method === 'HEAD')) {
      response = await env.ASSETS.fetch(requestForPath(request, '/index.html'));
    }

    return response ?? new Response('Not found', { status: 404 });
  },
};

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SITE_URL, getPage, schemaFor } from '../seo';
export default function PageMeta({ title, description }) {
  const { pathname } = useLocation();
  useEffect(() => {
    const page = getPage(pathname);
    const resolvedTitle = page?.title || title || 'Fryly';
    const resolvedDescription = page?.description || description || 'Organise your group with Fryly.';
    document.title = resolvedTitle;
    const set = (selector, attributes) => {
      let element = document.head.querySelector(selector);
      if (!element) { element = document.createElement(selector.startsWith('link') ? 'link' : 'meta'); document.head.appendChild(element); }
      Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    };
    set('meta[name="description"]', { name: 'description', content: resolvedDescription });
    set('meta[name="robots"]', { name: 'robots', content: page ? 'index,follow' : 'noindex,follow' });
    set('link[rel="canonical"]', { rel: 'canonical', href: `${SITE_URL}${pathname}` });
    for (const [name, content] of Object.entries({ title: resolvedTitle, description: resolvedDescription, url: `${SITE_URL}${pathname}`, image: `${SITE_URL}/teamwork.png` })) {
      set(`meta[property="og:${name}"]`, { property: `og:${name}`, content });
      if (name !== 'url') set(`meta[name="twitter:${name}"]`, { name: `twitter:${name}`, content });
    }
    document.querySelectorAll('script[type="application/ld+json"]').forEach(element => element.remove());
    if (page) { const script = document.createElement('script'); script.type = 'application/ld+json'; script.textContent = JSON.stringify(schemaFor(page)); document.head.appendChild(script); }
  }, [pathname, title, description]);
  return null;
}

import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import Home from './pages/Home';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import FAQ from './pages/FAQ';
import About from './pages/About';
import Contact from './pages/Contact';
import Guide from './pages/Guide';
import Footer from './components/Footer';
import { guides } from './seo';
const pages = { '/': Home, '/features': Features, '/pricing': Pricing, '/faq': FAQ, '/about': About, '/contact': Contact };
export function render(path) {
  const Page = pages[path];
  const guide = guides.find(page => page.path === path);
  return renderToString(<StaticRouter location={path}><header className="bg-white border-b p-4"><nav aria-label="Main navigation" className="max-w-7xl mx-auto flex gap-6"><a href="/" className="font-bold text-blue-600">fryly</a><a href="/features">Features</a><a href="/register">Create a group</a><a href="/login">Log in</a></nav></header><main>{Page ? <Page /> : <Guide page={guide} />}</main><Footer /></StaticRouter>);
}

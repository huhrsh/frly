import React from 'react';
import { Link } from 'react-router-dom';
import PageMeta from '../components/PageMeta';
import { guides } from '../seo';
export function GuideLinks() {
  return <nav aria-label="Group planning guides" className="mx-auto max-w-5xl py-8 px-4"><h2 className="text-xl font-bold mb-4">Find the right setup for your group</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{guides.map(page => <Link key={page.path} to={page.path} className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-800 hover:underline">{page.heading}</Link>)}</div></nav>;
}
export default function Guide({ page }) {
  return <article className="max-w-4xl mx-auto py-12 px-4"><PageMeta title={page.title} description={page.description} /><Link to="/" className="text-blue-700 hover:underline">Fryly</Link><h1 className="mt-5 text-3xl sm:text-4xl font-bold text-gray-900">{page.heading}</h1><p className="mt-5 text-lg text-gray-600">{page.description}</p><Link to="/register" className="inline-block my-7 rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold">Create your free group</Link>{page.sections.map(([heading, body]) => <section key={heading} className="my-8"><h2 className="text-2xl font-semibold text-gray-900">{heading}</h2><p className="mt-3 leading-7 text-gray-700">{body}</p></section>)}<p className="text-gray-600">Review <Link to="/features" className="text-blue-700 underline">all features</Link> or read the <Link to="/faq" className="text-blue-700 underline">frequently asked questions</Link>.</p><GuideLinks /></article>;
}

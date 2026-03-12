import { useEffect } from 'react';

function updateMetaDescription(content) {
  if (typeof document === 'undefined') return;
  let tag = document.querySelector('meta[name="description"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.name = 'description';
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content || '');
}

export default function PageMeta({ title, description }) {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (title) {
        document.title = title;
      }
      if (description) {
        updateMetaDescription(description);
      }
    }
  }, [title, description]);

  return null;
}

import React from 'react';
import PageMeta from '../components/PageMeta';

const Blog = () => {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
      <PageMeta
        title="fryly blog – Stories and updates"
        description="Read about how groups use fryly in real life and follow along with product updates and design notes."
      />
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3">Blog</h1>
      <p className="text-sm text-gray-600 mb-4">
        The blog will eventually share short notes on how groups use fryly in real life, along with product updates and small design decisions.
      </p>
      <p className="text-sm text-gray-600">
        For now there are no public posts yet. Check back after a few more product iterations.
      </p>
    </div>
  );
};

export default Blog;

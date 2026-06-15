import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import Sidebar from '../components/Sidebar';
import { Search as SearchIcon, Newspaper } from 'lucide-react';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndFilterPosts = async () => {
      setLoading(true);
      try {
        const response = await api.get('/posts/');
        const allPosts = response.data; // Already unwrapped array due to our response interceptor!
        
        if (query.trim() === '') {
          setPosts(allPosts);
        } else {
          const lowerQuery = query.toLowerCase();
          const filtered = allPosts.filter(
            (post) =>
              post.titulo.toLowerCase().includes(lowerQuery) ||
              post.contenido.toLowerCase().includes(lowerQuery) ||
              (post.categoria && post.categoria.nombre.toLowerCase().includes(lowerQuery))
          );
          setPosts(filtered);
        }
      } catch (error) {
        console.error('Error searching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndFilterPosts();
  }, [query]);

  const handleVoteSuccessInList = (postId, pos, neg, total, userVote) => {
    setPosts(prevPosts =>
      prevPosts.map(p =>
        p.id === postId
          ? { ...p, votos_positivos: pos, votos_negativos: neg, total_votos: total, user_vote: userVote }
          : p
      )
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
      {/* Search Feed (Left) */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Results Banner */}
        <div className="bg-white border border-brand-border rounded-md p-6 shadow-sm flex items-center gap-4">
          <div className="bg-brand-bg p-3 rounded-full text-brand-orange">
            <SearchIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-dark">Resultados de búsqueda</h1>
            <p className="text-xs text-brand-lightText font-semibold mt-1">
              {query ? (
                <>Mostrando resultados para <span className="text-brand-orange font-bold">"{query}"</span></>
              ) : (
                'Explora todos los temas disponibles'
              )}
            </p>
          </div>
        </div>

        {/* Feed List */}
        {loading ? (
          <div className="flex flex-col gap-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-white border border-brand-border rounded-md"></div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white border border-brand-border rounded-md p-16 text-center shadow-sm flex flex-col items-center justify-center gap-3">
            <Newspaper className="w-12 h-12 text-brand-lightText opacity-40" />
            <p className="text-brand-lightText font-bold">No se encontraron debates que coincidan con tu búsqueda.</p>
            <p className="text-xs text-brand-lightText">Intenta con términos más generales como "IA", "privacidad" o "derechos".</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-brand-lightText uppercase tracking-wider pl-1">
              Debates encontrados ({posts.length})
            </span>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onVoteSuccess={handleVoteSuccessInList}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sidebar (Right) */}
      <Sidebar />
    </div>
  );
};

export default Search;

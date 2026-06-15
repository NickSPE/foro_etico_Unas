import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import Sidebar from '../components/Sidebar';
import { EyeOff, Brain, Shield, Globe, Copyright, Info, Sparkles, TrendingUp, Calendar } from 'lucide-react';

const iconMap = {
  EyeOff: EyeOff,
  Brain: Brain,
  Shield: Shield,
  Globe: Globe,
  Copyright: Copyright
};

const CategoryPage = () => {
  const { categorySlug } = useParams();
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent'); // 'recent' or 'popular'

  const fetchCategoryAndPosts = async () => {
    setLoading(true);
    try {
      // Find category details first from list
      const catResponse = await api.get('/categorias/');
      const currentCat = catResponse.data.find(c => c.slug === categorySlug);
      setCategory(currentCat);

      // Fetch posts under this category slug
      const orderingParam = sortBy === 'popular' ? 'popular' : '';
      const response = await api.get(`/posts/?categoria=${categorySlug}&ordering=${orderingParam}`);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching category page:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryAndPosts();
  }, [categorySlug, sortBy]);

  const handleVoteSuccessInList = (postId, pos, neg, total, userVote) => {
    setPosts(prevPosts =>
      prevPosts.map(p =>
        p.id === postId
          ? { ...p, votos_positivos: pos, votos_negativos: neg, total_votos: total, user_vote: userVote }
          : p
      )
    );
  };

  const IconComponent = category && iconMap[category.icono] ? iconMap[category.icono] : Globe;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
      {/* Main Content (Left) */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Category Header Card */}
        {category && (
          <div className="bg-white border border-brand-border rounded-md shadow-sm p-5 flex items-start gap-4">
            <div className="p-3 bg-brand-bg rounded-md text-brand-orange">
              <IconComponent className="w-10 h-10 stroke-[2]" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-brand-dark mb-1">
                c/{category.nombre}
              </h1>
              <p className="text-sm text-brand-lightText leading-relaxed">
                {category.descripcion}
              </p>
            </div>
          </div>
        )}

        {/* Filters and Sorting Topbar */}
        <div className="bg-white border border-brand-border rounded-md px-4 py-3 shadow-sm flex items-center justify-between">
          <span className="text-xs font-bold text-brand-lightText tracking-wider uppercase">Debates Populares</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('recent')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                sortBy === 'recent'
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'bg-brand-bg text-brand-lightText hover:bg-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Más Recientes
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                sortBy === 'popular'
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'bg-brand-bg text-brand-lightText hover:bg-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Populares
            </button>
          </div>
        </div>

        {/* Posts feed */}
        {loading ? (
          <div className="flex flex-col gap-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-white border border-brand-border rounded-md"></div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white border border-brand-border rounded-md p-12 text-center shadow-sm">
            <p className="text-brand-lightText font-semibold mb-2">Aún no hay debates en c/{category?.nombre}.</p>
            <p className="text-xs text-brand-lightText">¡Sé el primero en iniciar un debate aquí haciendo clic en el botón Publicar!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
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

export default CategoryPage;

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import Sidebar from '../components/Sidebar';
import { Award, Calendar, CircleUser, Newspaper } from 'lucide-react';

const Profile = () => {
  const { username } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userKarma, setUserKarma] = useState(0);
  const [registrationDate, setRegistrationDate] = useState('Mayo 2026');

  useEffect(() => {
    const fetchUserPosts = async () => {
      setLoading(true);
      try {
        const response = await api.get('/posts/');
        const allPosts = response.data; // Array unwrap handled by axios interceptor
        
        // Filter posts created by this user
        const userFiltered = allPosts.filter(
          (post) => post.autor && post.autor.username.toLowerCase() === username.toLowerCase()
        );
        setPosts(userFiltered);

        // Calculate Ethics Karma (net upvotes minus downvotes)
        const totalKarma = userFiltered.reduce(
          (acc, post) => acc + (post.votos_positivos - post.votos_negativos),
          0
        );
        // Karma baseline of 1 + votes
        setUserKarma(Math.max(1, 10 + totalKarma));

        // Get registration date if present in first post or set default
        if (userFiltered.length > 0 && userFiltered[0].autor.fecha_registro) {
          const date = new Date(userFiltered[0].autor.fecha_registro);
          setRegistrationDate(date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }));
        }
      } catch (error) {
        console.error('Error fetching profile posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [username]);

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
      {/* Profile Info and Feed (Left) */}
      <div className="flex-1 flex flex-col gap-4">
        {/* User Card Details */}
        <div className="bg-white border border-brand-border rounded-md shadow-sm p-6 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
          {/* Decorative colored top accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-orange to-brand-blue"></div>
          
          <img
            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${username}`}
            alt={username}
            className="w-24 h-24 rounded-full border-2 border-brand-orange bg-brand-bg shrink-0 shadow-sm"
          />
          
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-black text-brand-dark flex items-center justify-center sm:justify-start gap-2">
              u/{username}
            </h1>
            <p className="text-xs font-semibold text-brand-lightText mt-1">
              Miembro respetado e investigador de los dilemas éticos globales.
            </p>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-xs font-bold">
              <div className="flex items-center gap-1.5 bg-orange-50 text-brand-orange px-3 py-1.5 rounded-full border border-orange-100">
                <Award className="w-4 h-4" />
                <span>{userKarma} Karma de Ética</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 text-brand-lightText px-3 py-1.5 rounded-full">
                <Calendar className="w-4 h-4" />
                <span>Se unió en {registrationDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* User posts list */}
        {loading ? (
          <div className="flex flex-col gap-4 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 bg-white border border-brand-border rounded-md"></div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white border border-brand-border rounded-md p-16 text-center shadow-sm flex flex-col items-center justify-center gap-3">
            <CircleUser className="w-12 h-12 text-brand-lightText opacity-40" />
            <p className="text-brand-lightText font-bold">u/{username} aún no ha iniciado ningún debate.</p>
            <p className="text-xs text-brand-lightText">Las publicaciones y aportes éticos creados aparecerán listados aquí.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-brand-lightText uppercase tracking-wider pl-1">
              Aportes y debates de u/{username} ({posts.length})
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

export default Profile;

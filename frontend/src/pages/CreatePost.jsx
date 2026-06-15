import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { AlertCircle, FileText, Send, Sparkles } from 'lucide-react';

const CreatePost = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redirect to login if user accesses page while unauthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categorias/');
        setCategories(response.data);
        if (response.data.length > 0) {
          setCategoriaId(response.data[0].id); // Select first by default
        }
      } catch (error) {
        console.error('Error fetching categories for post creation:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!titulo.trim() || !contenido.trim() || !categoriaId) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/posts/', {
        titulo,
        contenido,
        categoria: categoriaId
      });
      // Redirect to the post detail
      navigate(`/post/${response.data.id}`);
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error.response?.data?.detail || 'No se pudo crear el debate. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
      
      {/* Editor (Left) */}
      <div className="flex-1 flex flex-col gap-4">
        
        <div className="bg-white border border-brand-border rounded-md shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-2 border-b border-brand-bg pb-4 mb-5">
            <FileText className="w-6 h-6 text-brand-orange" />
            <h1 className="text-xl sm:text-2xl font-bold text-brand-dark">
              Crear un Debate Ético
            </h1>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3 rounded-md mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Category selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-brand-lightText uppercase">Selecciona el Tema / Categoría</label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="w-full bg-slate-50 border border-brand-border rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-blue focus:bg-white transition-all shadow-inner font-semibold"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    c/{cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-brand-lightText uppercase">Título del debate</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="¿Qué dilema o noticia ética quieres plantear?"
                className="w-full bg-slate-50 border border-brand-border rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-blue focus:bg-white transition-all shadow-inner font-semibold text-brand-dark"
                maxLength={100}
                required
              />
            </div>

            {/* Content Body */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-brand-lightText uppercase">Cuerpo de la discusión</label>
              <textarea
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                placeholder="Describe la situación moral o dilema tecnológico en detalle. Plantea preguntas abiertas para enriquecer el debate. Si es una noticia, te recomendamos resumirla e incluir un enlace de origen."
                rows={10}
                className="w-full bg-slate-50 border border-brand-border rounded-md px-4 py-3 text-sm focus:outline-none focus:border-brand-blue focus:bg-white transition-all shadow-inner leading-relaxed text-brand-dark"
                required
              ></textarea>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-brand-bg pt-4 mt-2">
              <Link
                to="/"
                className="px-5 py-2 rounded-full text-sm font-bold text-brand-lightText hover:bg-brand-bg transition-all"
              >
                Descartar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 bg-brand-orange hover:bg-opacity-90 text-white font-bold text-sm px-6 py-2 rounded-full transition-all shadow-md disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Publicando...' : 'Publicar Debate'}</span>
              </button>
            </div>
          </form>

        </div>

      </div>

      {/* Sidebar / Guidelines (Right) */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        
        {/* Guidelines card */}
        <div className="bg-white border border-brand-border rounded-md shadow-sm p-5">
          <h3 className="text-xs font-bold text-brand-lightText tracking-wider uppercase mb-4 flex items-center gap-1.5 border-b border-brand-bg pb-2">
            <Sparkles className="w-4 h-4 text-brand-orange" />
            Normas de Publicación
          </h3>
          
          <ul className="text-xs text-brand-dark text-opacity-90 flex flex-col gap-3.5 list-decimal pl-4 leading-relaxed font-medium">
            <li>
              <strong>Sé respetuoso:</strong> Se permiten las diferencias de opinión, pero no las descalificaciones personales ni ataques directos.
            </li>
            <li>
              <strong>Enfoque Ético:</strong> Asegúrate de que el tema debata sobre moral digital, derechos, responsabilidades o implicaciones sociales de la tecnología.
            </li>
            <li>
              <strong>Redacción clara:</strong> Describe el dilema de manera imparcial y objetiva para invitar al diálogo constructivo.
            </li>
            <li>
              <strong>Veracidad:</strong> Si publicas una noticia real, cita la fuente u organización. No difundas fake news.
            </li>
          </ul>
        </div>

        <Sidebar />
      </div>

    </div>
  );
};

export default CreatePost;

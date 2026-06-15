import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Bell, Heart, MessageSquare, Shield, Check, Info } from 'lucide-react';

const Inbox = () => {
  const { user, isAuthenticated } = useAuth();
  
  // Custom mock notifications that feel completely realistic and contextual
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'system',
      title: '¡Bienvenido a r/EticaDigital!',
      body: 'Gracias por unirte a la red líder en debates de ética tecnológica. Te sugerimos visitar la sección de "Inteligencia Artificial" para tus primeros aportes.',
      date: 'Hace 5 minutos',
      unread: true,
      icon: Shield,
      iconColor: 'text-brand-blue bg-blue-50 border-blue-100'
    },
    {
      id: 2,
      type: 'vote',
      title: 'Tu debate está ganando visibilidad',
      body: 'Tu primer post ha recibido más de 5 votos positivos de la comunidad de ética por diseño.',
      date: 'Hace 2 horas',
      unread: true,
      icon: Heart,
      iconColor: 'text-brand-orange bg-orange-50 border-orange-100'
    },
    {
      id: 3,
      type: 'reply',
      title: 'u/BotNoticias comentó en tu publicación',
      body: '"Excelente enfoque regulatorio. Concuerdo plenamente con que la transparencia algorítmica debe ser prioritaria en la UE..."',
      date: 'Hace 1 día',
      unread: false,
      icon: MessageSquare,
      iconColor: 'text-emerald-500 bg-emerald-50 border-emerald-100'
    },
    {
      id: 4,
      type: 'info',
      title: 'Semana de la Ciberseguridad',
      body: 'Recuerda que todos los miércoles nuestro Bot de Dilemas publica un enigma especial relacionado a la privacidad y cifrado extremo.',
      date: 'Hace 2 días',
      unread: false,
      icon: Info,
      iconColor: 'text-purple-500 bg-purple-50 border-purple-100'
    }
  ]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const toggleRead = (id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, unread: !n.unread } : n))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
      {/* Notifications Panel (Left) */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Header Block */}
        <div className="bg-white border border-brand-border rounded-md p-6 shadow-sm flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 text-brand-orange p-3 rounded-full border border-orange-100">
              <Bell className="w-6 h-6 animate-swing" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-dark">Bandeja de Entrada</h1>
              <p className="text-xs text-brand-lightText font-semibold mt-1">
                {unreadCount > 0 ? (
                  <>Tienes <span className="text-brand-orange font-bold">{unreadCount}</span> notificaciones no leídas</>
                ) : (
                  'Tu bandeja de entrada está al día'
                )}
              </p>
            </div>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 bg-brand-bg hover:bg-slate-200 border border-brand-border text-brand-dark font-bold text-xs px-4.5 py-2 rounded-full transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Marcar todo como leído</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        {!isAuthenticated ? (
          <div className="bg-white border border-brand-border rounded-md p-16 text-center shadow-sm">
            <p className="text-brand-lightText font-bold mb-2">Inicia sesión para ver tu bandeja de entrada.</p>
            <p className="text-xs text-brand-lightText">Las notificaciones de votos, comentarios y respuestas se guardarán aquí.</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white border border-brand-border rounded-md p-20 text-center shadow-sm flex flex-col items-center justify-center gap-3">
            <Bell className="w-12 h-12 text-brand-lightText opacity-40" />
            <p className="text-brand-lightText font-bold">No tienes ninguna notificación.</p>
            <p className="text-xs text-brand-lightText">Te avisaremos tan pronto como ocurra algo relevante en tus debates favoritos.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {notifications.map((n) => {
              const IconComponent = n.icon;
              return (
                <div
                  key={n.id}
                  className={`border rounded-md p-4 bg-white transition-all shadow-sm flex items-start gap-4 relative ${
                    n.unread ? 'border-brand-blue bg-blue-50/20' : 'border-brand-border'
                  }`}
                >
                  {/* Left Icon Badge */}
                  <div className={`p-2.5 rounded-full shrink-0 border ${n.iconColor}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  
                  {/* Content details */}
                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-sm font-bold text-brand-dark leading-tight">{n.title}</span>
                      {n.unread && (
                        <span className="bg-brand-blue text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                          Nuevo
                        </span>
                      )}
                      <span className="text-[10px] text-brand-lightText font-semibold">{n.date}</span>
                    </div>
                    <p className="text-xs text-brand-lightText leading-relaxed font-medium">{n.body}</p>
                  </div>

                  {/* Actions buttons */}
                  <div className="absolute right-3 top-3 flex gap-1">
                    <button
                      onClick={() => toggleRead(n.id)}
                      className={`text-brand-lightText hover:text-brand-blue p-1 rounded hover:bg-brand-bg transition-colors`}
                      title={n.unread ? "Marcar como leído" : "Marcar como no leído"}
                    >
                      <Check className={`w-4 h-4 ${!n.unread ? 'text-brand-blue stroke-[2.5]' : ''}`} />
                    </button>
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="text-brand-lightText hover:text-red-500 p-1 rounded hover:bg-brand-bg transition-colors"
                      title="Eliminar notificación"
                    >
                      <span className="text-xs font-semibold select-none leading-none px-1">✕</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sidebar (Right) */}
      <Sidebar />
    </div>
  );
};

export default Inbox;

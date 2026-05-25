import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, X } from "lucide-react";

const SESSION_KEY = "rede_solo_splash_shown";

export default function WelcomeSplash({ userEmail }) {
  const [visible, setVisible] = useState(false);
  const [nextCompromisso, setNextCompromisso] = useState(null);

  useEffect(() => {
    if (!userEmail) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    async function load() {
      const now = new Date();
      const items = await base44.entities.AgendaCrianca.filter(
        { created_by: userEmail },
        "data_horario",
        10
      );
      const upcoming = items
        .filter((i) => new Date(i.data_horario) > now)
        .sort((a, b) => new Date(a.data_horario) - new Date(b.data_horario));

      setNextCompromisso(upcoming[0] || null);
      setVisible(true);
      sessionStorage.setItem(SESSION_KEY, "1");
    }

    load();
  }, [userEmail]);

  const close = () => setVisible(false);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={close}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Card */}
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            transition={{ duration: 0.35, type: "spring", bounce: 0.3 }}
            className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Welcome Banner */}
            <div className="relative bg-gradient-to-br from-[#FF2E88] via-[#FF5BA8] to-[#FF7EB6] p-7 text-white">
              <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

              <button
                onClick={close}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative">
                <div className="mb-4">
                  <img
                    src="https://media.base44.com/images/public/6a0a8bdecb146b0eeeee0a02/ecb2b9d67_LogoRedeSolo.png"
                    alt="RedeSolo"
                    className="h-7 w-auto object-contain brightness-0 invert"
                  />
                </div>
                <h1 className="text-2xl font-heading font-bold mb-2 leading-tight">
                  Olá, bem-vinda! 💕
                </h1>
                <p className="text-sm opacity-90 font-body leading-relaxed">
                  Informação, apoio e autonomia em um só lugar. Você não está sozinha. 🤝
                </p>
                <p className="text-xs opacity-70 mt-4 font-body capitalize">
                  {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Next Appointment */}
            <div className="bg-card p-5">
              {nextCompromisso ? (
                <div>
                  <p className="text-xs font-body text-muted-foreground mb-3 uppercase tracking-wide font-semibold">
                    Próximo compromisso
                  </p>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary/8 border border-primary/15">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-heading font-bold text-foreground truncate">
                        {nextCompromisso.descricao}
                      </p>
                      <p className="text-xs text-muted-foreground font-body mt-0.5">
                        {nextCompromisso.filho_nome} •{" "}
                        {format(new Date(nextCompromisso.data_horario), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground font-body text-center py-2">
                  Nenhum compromisso agendado. 🗓️
                </p>
              )}

              <button
                onClick={close}
                className="w-full mt-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium font-body hover:bg-primary/90 transition-colors"
              >
                Entrar no app
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
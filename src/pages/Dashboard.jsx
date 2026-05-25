import React, { useCallback, useState, useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calendar, DollarSign, Scale, Handshake, Baby, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import PullToRefresh from "../components/ui/PullToRefresh";
import WelcomeSplash from "../components/WelcomeSplash";

const quickActions = [
  { 
    path: "/filhos", 
    label: "Meus Filhos", 
    desc: "Cadastre e gerencie seus dependentes",
    icon: Baby, 
    gradient: "from-pink-500 to-rose-400" 
  },
  { 
    path: "/agenda", 
    label: "Agenda", 
    desc: "Compromissos e consultas",
    icon: Calendar, 
    gradient: "from-violet-500 to-purple-400" 
  },
  { 
    path: "/financeiro", 
    label: "Financeiro", 
    desc: "Controle seus gastos",
    icon: DollarSign, 
    gradient: "from-emerald-500 to-teal-400" 
  },
  { 
    path: "/direitos", 
    label: "Direitos", 
    desc: "Conheça seus benefícios",
    icon: Scale, 
    gradient: "from-amber-500 to-orange-400" 
  },
  { 
    path: "/parceiros", 
    label: "Parceiros", 
    desc: "Descontos e ofertas especiais",
    icon: Handshake, 
    gradient: "from-sky-500 to-blue-400" 
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["filhos"] }),
      queryClient.invalidateQueries({ queryKey: ["agenda-recent"] }),
    ]);
  }, [queryClient]);

  const { data: filhos } = useQuery({
    queryKey: ["filhos", user?.email],
    queryFn: () => base44.entities.Filho.filter({ created_by: user?.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: agenda } = useQuery({
    queryKey: ["agenda-recent", user?.email],
    queryFn: () => base44.entities.AgendaCrianca.filter({ created_by: user?.email }, "-data_horario", 3),
    enabled: !!user?.email,
    initialData: [],
  });

  const today = new Date();

  const [alertDismissed, setAlertDismissed] = useState(false);

  const proximoAlerta = useMemo(() => {
    const now = new Date();
    const upcoming = agenda
      .filter((i) => {
        const diff = new Date(i.data_horario) - now;
        return diff > 0 && diff <= 3 * 60 * 60 * 1000;
      })
      .sort((a, b) => new Date(a.data_horario) - new Date(b.data_horario));
    return upcoming[0] || null;
  }, [agenda]);

  return (
    <>
    <WelcomeSplash userEmail={user?.email} />
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FF2E88] via-[#FF5BA8] to-[#FF7EB6] p-6 md:p-8 text-white shadow-xl shadow-[#FF2E88]/25"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <img
                src="https://media.base44.com/images/public/6a0a8bdecb146b0eeeee0a02/ecb2b9d67_LogoRedeSolo.png"
                alt="RedeSolo"
                className="h-7 w-auto object-contain brightness-0 invert"
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold mb-2 leading-tight">
              Olá, bem-vinda! 💕
            </h1>
            <p className="text-sm md:text-base opacity-90 font-body max-w-lg leading-relaxed">
              Informação, apoio e autonomia em um só lugar. Você não está sozinha. 🤝
            </p>
            <p className="text-xs opacity-70 mt-3 font-body capitalize">
              {format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Upcoming alert */}
      {proximoAlerta && !alertDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/30"
        >
          <span className="text-2xl shrink-0">⏰</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-heading font-bold text-foreground">Compromisso em breve!</p>
            <p className="text-xs text-muted-foreground font-body mt-0.5 truncate">
              <strong>{proximoAlerta.filho_nome}</strong> — {proximoAlerta.descricao} às {format(new Date(proximoAlerta.data_horario), "HH:mm")}
            </p>
          </div>
          <button
            onClick={() => setAlertDismissed(true)}
            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-heading font-bold text-foreground mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.07 }}
            >
            <Link to={action.path}>
              <Card className="group p-5 hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/30">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="font-heading font-bold text-foreground mt-4">{action.label}</h3>
                <p className="text-sm text-muted-foreground font-body mt-1">{action.desc}</p>
              </Card>
            </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Filhos */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">Meus Filhos</h3>
            <Link to="/filhos" className="text-sm text-primary font-medium hover:underline font-body">Ver todos</Link>
          </div>
          {filhos.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body">Nenhum filho cadastrado ainda.</p>
          ) : (
            <div className="space-y-3">
              {filhos.slice(0, 3).map((filho) => (
                <div key={filho.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Baby className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium font-body">{filho.nome}</p>
                    <p className="text-xs text-muted-foreground font-body">
                      {filho.data_nascimento && format(new Date(filho.data_nascimento), "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Próximos compromissos */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">Próximos Compromissos</h3>
            <Link to="/agenda" className="text-sm text-primary font-medium hover:underline font-body">Ver todos</Link>
          </div>
          {agenda.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body">Nenhum compromisso agendado.</p>
          ) : (
            <div className="space-y-3">
              {agenda.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium font-body truncate">{item.descricao}</p>
                    <p className="text-xs text-muted-foreground font-body">
                      {item.filho_nome} • {format(new Date(item.data_horario), "dd/MM HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
    </PullToRefresh>
    </>
  );
}
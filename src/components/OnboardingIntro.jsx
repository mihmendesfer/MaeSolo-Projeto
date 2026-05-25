import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Baby, Calendar, DollarSign, Scale, Handshake, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const LOGO = "https://media.base44.com/images/public/6a0a8bdecb146b0eeeee0a02/ecb2b9d67_LogoRedeSolo.png";

const steps = [
  {
    logo: true,
    gradient: "from-[#FF2E88] to-[#FF7EB6]",
    title: "Bem-vinda ao RedeSolo! 💕",
    desc: "Informação, apoio e autonomia em um só lugar. Um espaço criado especialmente para mães solo organizarem sua rotina, conhecerem seus direitos e acessarem benefícios.",
    emoji: "🌸",
  },
  {
    icon: Baby,
    gradient: "from-[#FF2E88] to-[#FF5FA2]",
    title: "Cadastre seus filhos",
    desc: "Registre o nome e data de nascimento dos seus filhos para organizar tudo de forma personalizada.",
    emoji: "👶",
  },
  {
    icon: Calendar,
    gradient: "from-[#FF5FA2] to-[#FF7EB6]",
    title: "Agenda inteligente",
    desc: "Adicione consultas, reuniões escolares e eventos. Você receberá lembretes automáticos antes de cada compromisso.",
    emoji: "📅",
  },
  {
    icon: DollarSign,
    gradient: "from-[#FF2E88] to-[#FF5FA2]",
    title: "Controle financeiro",
    desc: "Registre suas despesas e acompanhe gráficos mensais. Vincule gastos a cada filho para ter um controle ainda mais detalhado.",
    emoji: "💰",
  },
  {
    icon: Scale,
    gradient: "from-[#FF5FA2] to-[#FF7EB6]",
    title: "Conheça seus direitos",
    desc: "Acesse um guia completo sobre benefícios, programas sociais e direitos legais disponíveis para mães solo.",
    emoji: "⚖️",
  },
  {
    icon: Handshake,
    gradient: "from-[#FF2E88] to-[#FF5FA2]",
    title: "Parceiros e descontos",
    desc: "Confira ofertas e descontos exclusivos de empresas parceiras para facilitar o seu dia a dia.",
    emoji: "🤝",
  },
];

export default function OnboardingIntro({ userEmail }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!userEmail) return;
    const key = `onboarding_done_${userEmail}`;
    if (!localStorage.getItem(key)) {
      setVisible(true);
    }
  }, [userEmail]);

  const finish = () => {
    localStorage.setItem(`onboarding_done_${userEmail}`, "1");
    setVisible(false);
  };

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else finish();
  };

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />

          {/* Card */}
          <motion.div
            className="relative bg-card rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            initial={{ scale: 0.85, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            {/* Top gradient bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#FF2E88] to-[#FF7EB6]" />

            {/* Content area */}
            <div className="px-8 pt-8 pb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center text-center"
                >
                  {/* Icon or Logo */}
                  {current.logo ? (
                    <img src={LOGO} alt="RedeSolo" className="h-20 w-auto object-contain mb-4 drop-shadow-md" />
                  ) : (
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${current.gradient} flex items-center justify-center shadow-lg mb-4`}>
                      {current.icon && <current.icon className="w-10 h-10 text-white" />}
                    </div>
                  )}

                  <span className="text-4xl mb-3">{current.emoji}</span>

                  <h2 className="text-xl font-heading font-bold text-foreground mb-3">
                    {current.title}
                  </h2>
                  <p className="text-sm text-muted-foreground font-body leading-relaxed">
                    {current.desc}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 pb-4">
              {steps.map((_, i) => (
                <motion.div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${i === step ? "bg-primary w-6" : "bg-muted w-2"}`}
                  onClick={() => setStep(i)}
                  style={{ cursor: "pointer" }}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="px-8 pb-8 flex justify-between items-center">
              <button
                onClick={finish}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
              >
                Pular
              </button>
              <Button
                onClick={next}
                className="gap-2 rounded-xl bg-gradient-to-r from-[#FF2E88] to-[#FF5FA2] border-0 text-white hover:opacity-90 shadow-md shadow-[#FF2E88]/30"
              >
                {isLast ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Começar
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
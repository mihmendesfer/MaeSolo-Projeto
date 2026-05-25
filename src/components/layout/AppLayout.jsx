import React, { useState, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, Calendar, DollarSign, Scale, Handshake, Baby, 
  Menu, LogOut, ChevronLeft, Trash2, Sun, Moon
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import useAgendaReminders from "@/hooks/useAgendaReminders";
import useScrollRestoration from "@/hooks/useScrollRestoration";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "./PageTransition";
import OnboardingIntro from "../OnboardingIntro";

const navItems = [
  { path: "/", label: "Início", icon: Home },
  { path: "/filhos", label: "Meus Filhos", icon: Baby },
  { path: "/agenda", label: "Agenda", icon: Calendar },
  { path: "/financeiro", label: "Financeiro", icon: DollarSign },
  { path: "/direitos", label: "Direitos", icon: Scale },
  { path: "/parceiros", label: "Parceiros", icon: Handshake },
];

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { isDark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [notifBanner, setNotifBanner] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useAgendaReminders(user?.email);
  useScrollRestoration();

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      setNotifBanner(true);
    }
  }, []);

  const requestNotifPermission = async () => {
    if (typeof Notification !== "undefined") {
      await Notification.requestPermission();
    }
    setNotifBanner(false);
  };

  const handleLogout = () => base44.auth.logout();

  const handleDeleteAccount = async () => {
    setShowDeleteConfirm(false);
    // Best-effort data cleanup before account removal
    try {
      const [filhos, agenda, despesas] = await Promise.all([
        base44.entities.Filho.filter({ created_by: user?.email }),
        base44.entities.AgendaCrianca.filter({ created_by: user?.email }),
        base44.entities.Despesa.filter({ created_by: user?.email }),
      ]);
      await Promise.all([
        ...filhos.map((r) => base44.entities.Filho.delete(r.id)),
        ...agenda.map((r) => base44.entities.AgendaCrianca.delete(r.id)),
        ...despesas.map((r) => base44.entities.Despesa.delete(r.id)),
      ]);
    } catch (_) {
      // Proceed with logout even if cleanup fails
    }
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-background flex">
      <OnboardingIntro userEmail={user?.email} />
      {/* Notification permission banner */}
      {notifBanner && (
        <div className="fixed bottom-20 lg:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md bg-card border border-border rounded-2xl shadow-xl p-4 flex items-start gap-3">
          <span className="text-2xl">🔔</span>
          <div className="flex-1">
            <p className="text-sm font-heading font-bold text-foreground">Ativar lembretes da agenda</p>
            <p className="text-xs text-muted-foreground font-body mt-0.5">Receba notificações antes dos compromissos dos seus filhos.</p>
            <div className="flex gap-2 mt-3">
              <button onClick={requestNotifPermission} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                Ativar notificações
              </button>
              <button onClick={() => setNotifBanner(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2">
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-72 bg-card border-r border-border z-50
        transform transition-transform duration-300 ease-out
        lg:translate-x-0 lg:static lg:z-auto
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-5 border-b border-border">
            <Link to="/" className="flex items-center justify-center" onClick={() => setMobileOpen(false)}>
              <img
                src="https://media.base44.com/images/public/6a0a8bdecb146b0eeeee0a02/ecb2b9d67_LogoRedeSolo.png"
                alt="RedeSolo"
                className="h-16 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium font-body
                    transition-all duration-200
                    ${isActive 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-border space-y-1">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all w-full font-body"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {isDark ? "Modo Claro" : "Modo Escuro"}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full font-body"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium text-destructive/60 hover:bg-destructive/10 hover:text-destructive transition-all w-full font-body"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Minha Conta
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen">
        {/* Mobile header */}
        <header
          className="lg:hidden sticky top-0 z-30 bg-card/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-between"
          style={{ paddingTop: `calc(0.75rem + env(safe-area-inset-top))` }}
        >
          {location.pathname !== "/" ? (
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-6 h-6" />
            </Button>
          ) : (
            <div className="w-9" />
          )}
          <div className="flex items-center justify-center">
            <img
              src="https://media.base44.com/images/public/6a0a8bdecb146b0eeeee0a02/ecb2b9d67_LogoRedeSolo.png"
              alt="RedeSolo"
              className="h-8 w-auto object-contain"
            />
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="w-6 h-6" />
          </Button>
        </header>

        <div className="p-4 md:p-8 pb-24 lg:pb-8 max-w-6xl mx-auto">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-lg border-t border-border flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {[
          { path: "/", label: "Início", icon: Home },
          { path: "/filhos", label: "Filhos", icon: Baby },
          { path: "/agenda", label: "Agenda", icon: Calendar },
          { path: "/financeiro", label: "Finanças", icon: DollarSign },
        ].map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <tab.icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`} />
              <span className="text-[10px] font-body font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Delete Account Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Excluir Minha Conta</AlertDialogTitle>
            <AlertDialogDescription className="font-body" asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Esta ação é <strong className="text-foreground">irreversível</strong>. Ao confirmar, serão excluídos permanentemente:</p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Todos os filhos cadastrados</li>
                  <li>Toda a agenda e compromissos</li>
                  <li>Todo o histórico financeiro e despesas</li>
                  <li>Sua conta e dados de acesso</li>
                </ul>
                <p>Não será possível recuperar nenhum dado após a exclusão.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteAccount}
            >
              Excluir conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
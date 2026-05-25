import React, { useState, useCallback } from "react";
import PullToRefresh from "../components/ui/PullToRefresh";
import { useAuth } from "@/lib/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calendar, Plus, Trash2, Clock, Baby, List, CalendarDays } from "lucide-react";
import CalendarView from "../components/agenda/CalendarView";
import AgentChat from "../components/agenda/AgentChat";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MobileSelect from "../components/MobileSelect";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Agenda() {
  const [showDialog, setShowDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // "list" | "calendar"
  const [form, setForm] = useState({ filho_id: "", data_horario: "", descricao: "" });
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: filhos } = useQuery({
    queryKey: ["filhos", user?.email],
    queryFn: () => base44.entities.Filho.filter({ created_by: user?.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: compromissos, isLoading } = useQuery({
    queryKey: ["agenda", user?.email],
    queryFn: () => base44.entities.AgendaCrianca.filter({ created_by: user?.email }, "-data_horario"),
    enabled: !!user?.email,
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AgendaCrianca.create(data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["agenda", user?.email] });
      const prev = queryClient.getQueryData(["agenda", user?.email]);
      queryClient.setQueryData(["agenda", user?.email], (old) => [
        { ...newData, id: `temp-${Date.now()}`, created_by: user?.email },
        ...(old || []),
      ]);
      setShowDialog(false);
      setForm({ filho_id: "", data_horario: "", descricao: "" });
      return { prev };
    },
    onError: (_err, _vars, ctx) => queryClient.setQueryData(["agenda", user?.email], ctx?.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["agenda"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AgendaCrianca.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda"] });
      setDeleteId(null);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.filho_id || !form.data_horario || !form.descricao) return;
    const selectedFilho = filhos.find(f => f.id === form.filho_id);
    createMutation.mutate({
      ...form,
      filho_nome: selectedFilho?.nome || "",
    });
  };

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["agenda"] });
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Agenda da Criança</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">Compromissos, consultas e eventos</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-secondary rounded-xl p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-body transition-all ${
                viewMode === "list" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="w-3.5 h-3.5" /> Lista
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-body transition-all ${
                viewMode === "calendar" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Calendário
            </button>
          </div>
          <Button onClick={() => setShowDialog(true)} className="gap-2 rounded-xl" disabled={filhos.length === 0}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo</span>
          </Button>
        </div>
      </div>

      {filhos.length === 0 && (
        <Card className="p-6 bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-800 font-body">
            ⚠️ Você precisa cadastrar pelo menos um filho antes de criar compromissos na agenda.
          </p>
        </Card>
      )}

      {viewMode === "calendar" ? (
        <CalendarView compromissos={compromissos} />
      ) : compromissos.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-10 h-10 text-primary" />
          </div>
          <h3 className="font-heading font-bold text-foreground mb-2">Agenda vazia</h3>
          <p className="text-sm text-muted-foreground font-body">
            Adicione compromissos para organizar a rotina dos seus filhos.
          </p>
        </Card>
      ) : (
        <AnimatePresence>
        <div className="space-y-3">
          {compromissos.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
            >
            <Card className="p-4 flex items-start gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-semibold text-foreground">{item.descricao}</h3>
                <div className="flex flex-wrap gap-3 mt-1">
                  <span className="text-sm text-muted-foreground font-body flex items-center gap-1">
                    <Baby className="w-3 h-3" />
                    {item.filho_nome}
                  </span>
                  <span className="text-sm text-muted-foreground font-body flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(item.data_horario), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive shrink-0"
                onClick={() => setDeleteId(item.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
            </motion.div>
          ))}
        </div>
        </AnimatePresence>
      )}

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Novo Compromisso</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="font-body">Filho(a) *</Label>
              <MobileSelect
                value={form.filho_id}
                onValueChange={(v) => setForm({ ...form, filho_id: v })}
                options={filhos.map((f) => ({ value: f.id, label: f.nome }))}
                placeholder="Selecione o filho(a)"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Data e Horário *</Label>
              <Input
                type="datetime-local"
                value={form.data_horario}
                onChange={(e) => setForm({ ...form, data_horario: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Descrição *</Label>
              <Textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Ex: Consulta pediátrica, Reunião escolar..."
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              Tem certeza que deseja excluir este compromisso?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate(deleteId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </PullToRefresh>
    <AgentChat />
    </>
  );
}
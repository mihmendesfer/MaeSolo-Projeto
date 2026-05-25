import React, { useState, useCallback } from "react";
import PullToRefresh from "../components/ui/PullToRefresh";
import { useAuth } from "@/lib/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { DollarSign, Plus, Trash2, TrendingDown, BarChart2 } from "lucide-react";
import MobileSelect from "../components/MobileSelect";
import ResumoMensal from "../components/financeiro/ResumoMensal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

export default function Financeiro() {
  const [showDialog, setShowDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [tab, setTab] = useState("despesas"); // "despesas" | "resumo"
  const [form, setForm] = useState({ valor: "", descricao: "", data: "", categoria: "Outros", filho_id: "", filho_nome: "" });
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: despesas, isLoading } = useQuery({
    queryKey: ["despesas", user?.email],
    queryFn: () => base44.entities.Despesa.filter({ created_by: user?.email }, "-data"),
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: filhos } = useQuery({
    queryKey: ["filhos", user?.email],
    queryFn: () => base44.entities.Filho.filter({ created_by: user?.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Despesa.create(data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["despesas", user?.email] });
      const prev = queryClient.getQueryData(["despesas", user?.email]);
      queryClient.setQueryData(["despesas", user?.email], (old) => [
        { ...newData, id: `temp-${Date.now()}`, created_by: user?.email },
        ...(old || []),
      ]);
      setShowDialog(false);
      setForm({ valor: "", descricao: "", data: "", categoria: "Outros", filho_id: "", filho_nome: "" });
      return { prev };
    },
    onError: (_err, _vars, ctx) => queryClient.setQueryData(["despesas", user?.email], ctx?.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["despesas"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Despesa.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["despesas", user?.email] });
      const prev = queryClient.getQueryData(["despesas", user?.email]);
      queryClient.setQueryData(["despesas", user?.email], (old) => (old || []).filter((d) => d.id !== id));
      setDeleteId(null);
      return { prev };
    },
    onError: (_err, _vars, ctx) => queryClient.setQueryData(["despesas", user?.email], ctx?.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["despesas"] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.valor || !form.descricao || !form.data) return;
    const selectedFilho = filhos.find(f => f.id === form.filho_id);
    createMutation.mutate({
      valor: parseFloat(form.valor),
      descricao: form.descricao,
      data: form.data,
      categoria: form.categoria || "Outros",
      ...(selectedFilho ? { filho_id: selectedFilho.id, filho_nome: selectedFilho.nome } : {}),
    });
  };

  const totalGastos = despesas.reduce((sum, d) => sum + (d.valor || 0), 0);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["despesas"] });
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Financeiro</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">Acompanhe suas despesas</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-secondary rounded-xl p-1">
            <button
              onClick={() => setTab("despesas")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-body transition-all ${
                tab === "despesas" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" /> Despesas
            </button>
            <button
              onClick={() => setTab("resumo")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-body transition-all ${
                tab === "resumo" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" /> Resumo
            </button>
          </div>
          {tab === "despesas" && (
            <Button onClick={() => setShowDialog(true)} className="gap-2 rounded-xl">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Despesa</span>
            </Button>
          )}
        </div>
      </div>

      {tab === "resumo" && <ResumoMensal />}

      {tab === "despesas" && (<>
      {/* Total Card */}
      <Card className="p-6 bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm opacity-90 font-body">Total de gastos registrados</p>
            <p className="text-2xl font-heading font-bold">
              R$ {totalGastos.toFixed(2).replace(".", ",")}
            </p>
          </div>
        </div>
      </Card>

      {despesas.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-10 h-10 text-primary" />
          </div>
          <h3 className="font-heading font-bold text-foreground mb-2">Nenhuma despesa registrada</h3>
          <p className="text-sm text-muted-foreground font-body">
            Comece a registrar seus gastos para ter um melhor controle financeiro.
          </p>
        </Card>
      ) : (
        <AnimatePresence>
        <div className="space-y-3">
          {despesas.map((despesa, i) => (
            <motion.div
              key={despesa.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
            >
            <Card className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-body font-medium text-foreground truncate">{despesa.descricao}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground font-body">
                    {despesa.data && (() => { const [y,m,d] = despesa.data.split('T')[0].split('-').map(Number); return format(new Date(y,m-1,d), 'dd/MM/yyyy'); })()}
                  </p>
                  {despesa.categoria && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-body">{despesa.categoria}</span>
                  )}
                </div>
              </div>
              <p className="font-heading font-bold text-foreground shrink-0">
                R$ {despesa.valor?.toFixed(2).replace(".", ",")}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive shrink-0"
                onClick={() => setDeleteId(despesa.id)}
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
            <DialogTitle className="font-heading">Nova Despesa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="font-body">Valor (R$) *</Label>
              <Input type="number" step="0.01" min="0" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" required />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Descrição *</Label>
              <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Compras do mês, Remédios, Fralda..." required />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Categoria *</Label>
              <MobileSelect
                value={form.categoria}
                onValueChange={(v) => setForm({ ...form, categoria: v })}
                options={["Alimentação","Saúde","Educação","Transporte","Lazer","Roupas","Casa","Outros"].map(c => ({ value: c, label: c }))}
                placeholder="Selecione a categoria"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Data *</Label>
              <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
            </div>
            {filhos.length > 0 && (
              <div className="space-y-2">
                <Label className="font-body">Vincular a filho(a) (opcional)</Label>
                <MobileSelect
                  value={form.filho_id}
                  onValueChange={(v) => setForm({ ...form, filho_id: v })}
                  options={filhos.map((f) => ({ value: f.id, label: f.nome }))}
                  placeholder="Vincular a filho(a)"
                  emptyOption={{ value: "", label: "Sem vínculo" }}
                />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      </>)}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              Tem certeza que deseja excluir esta despesa?
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
  );
}
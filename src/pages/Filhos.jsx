import React, { useState, useCallback } from "react";
import PullToRefresh from "../components/ui/PullToRefresh";
import { useAuth } from "@/lib/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Baby, Plus, Trash2, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

export default function Filhos() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingFilho, setEditingFilho] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ nome: "", data_nascimento: "" });
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: filhos, isLoading } = useQuery({
    queryKey: ["filhos", user?.email],
    queryFn: () => base44.entities.Filho.filter({ created_by: user?.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Filho.create(data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["filhos", user?.email] });
      const prev = queryClient.getQueryData(["filhos", user?.email]);
      queryClient.setQueryData(["filhos", user?.email], (old) => [
        ...(old || []),
        { ...newData, id: `temp-${Date.now()}`, created_by: user?.email },
      ]);
      return { prev };
    },
    onError: (_err, _vars, ctx) => queryClient.setQueryData(["filhos", user?.email], ctx?.prev),
    onSuccess: () => closeDialog(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["filhos"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Filho.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filhos"] });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Filho.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["filhos", user?.email] });
      const prev = queryClient.getQueryData(["filhos", user?.email]);
      queryClient.setQueryData(["filhos", user?.email], (old) => (old || []).filter((f) => f.id !== id));
      setDeleteId(null);
      return { prev };
    },
    onError: (_err, _vars, ctx) => queryClient.setQueryData(["filhos", user?.email], ctx?.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["filhos"] }),
  });

  const openCreate = () => {
    setEditingFilho(null);
    setForm({ nome: "", data_nascimento: "" });
    setShowDialog(true);
  };

  const openEdit = (filho) => {
    setEditingFilho(filho);
    setForm({ nome: filho.nome, data_nascimento: filho.data_nascimento?.split("T")[0] || "" });
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingFilho(null);
    setForm({ nome: "", data_nascimento: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nome || !form.data_nascimento) return;
    if (editingFilho) {
      updateMutation.mutate({ id: editingFilho.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["filhos"] });
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
          <h1 className="text-2xl font-heading font-bold text-foreground">Meus Filhos</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">Cadastre e gerencie seus dependentes</p>
        </div>
        <Button onClick={openCreate} className="gap-2 rounded-xl">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Adicionar</span>
        </Button>
      </div>

      {filhos.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Baby className="w-10 h-10 text-primary" />
          </div>
          <h3 className="font-heading font-bold text-foreground mb-2">Nenhum filho cadastrado</h3>
          <p className="text-sm text-muted-foreground font-body mb-4">
            Cadastre seus filhos para poder organizar a agenda e compromissos.
          </p>
          <Button onClick={openCreate} className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" />
            Cadastrar primeiro filho
          </Button>
        </Card>
      ) : (
        <AnimatePresence>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filhos.map((filho, i) => (
            <motion.div
              key={filho.id}
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.28, delay: i * 0.06 }}
            >
            <Card className="p-5 group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Baby className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-foreground">{filho.nome}</h3>
                    <p className="text-sm text-muted-foreground font-body">
                      {filho.data_nascimento && (() => { const [y,m,d] = filho.data_nascimento.split('T')[0].split('-').map(Number); return format(new Date(y, m-1, d), 'dd/MM/yyyy'); })()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(filho)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(filho.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
            </motion.div>
          ))}
        </div>
        </AnimatePresence>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingFilho ? "Editar Filho" : "Cadastrar Novo Filho"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="font-body">Nome *</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Nome do filho(a)"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Data de Nascimento *</Label>
              <Input
                type="date"
                value={form.data_nascimento}
                onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? "Salvando..." : "Salvar"}
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
              Tem certeza que deseja excluir este filho? Esta ação não pode ser desfeita.
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
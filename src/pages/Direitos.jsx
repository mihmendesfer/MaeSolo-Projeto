import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Scale, ExternalLink, BookOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DireitosChat from "../components/direitos/DireitosChat";

const CATEGORIAS = [
  { label: "Todos", keywords: [] },
  { label: "Financeiro", keywords: ["bolsa", "auxílio", "renda", "benefício", "pagamento", "pé-de-meia", "meia", "salário"] },
  { label: "Saúde", keywords: ["saúde", "médico", "hospital", "vacina", "plano"] },
  { label: "Educação", keywords: ["escola", "educação", "ensino", "estudante", "meia"] },
  { label: "Jurídico", keywords: ["lei", "judicial", "pensão", "aliment", "guarda", "presos", "preso"] },
  { label: "Assistência", keywords: ["assistência", "social", "cras", "creas"] },
];

export default function Direitos() {
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("Todos");

  const { data: direitos, isLoading } = useQuery({
    queryKey: ["direitos"],
    queryFn: () => base44.entities.Direito.list(),
    initialData: [],
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const cat = CATEGORIAS.find((c) => c.label === categoria);
    return direitos.filter((d) => {
      const matchSearch = !q || d.titulo?.toLowerCase().includes(q) || d.descricao?.toLowerCase().includes(q);
      const matchCat = cat?.keywords.length === 0 || cat?.keywords.some(
        (kw) => d.titulo?.toLowerCase().includes(kw) || d.descricao?.toLowerCase().includes(kw)
      );
      return matchSearch && matchCat;
    });
  }, [direitos, search, categoria]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Guia de Direitos</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">
          Conheça seus direitos e benefícios como mãe solo
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar direitos e benefícios..."
          className="pl-9 rounded-xl"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIAS.map((cat) => (
          <button
            key={cat.label}
            onClick={() => setCategoria(cat.label)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium font-body transition-all ${
              categoria === cat.label
                ? "bg-primary text-primary-foreground shadow"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Scale className="w-10 h-10 text-primary" />
          </div>
          <h3 className="font-heading font-bold text-foreground mb-2">Nenhum resultado encontrado</h3>
          <p className="text-sm text-muted-foreground font-body">
            Tente outros termos ou categorias.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((direito, i) => (
            <motion.div
              key={direito.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
            >
            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-bold text-foreground text-lg">{direito.titulo}</h3>
                  <p className="text-sm text-muted-foreground font-body mt-2 leading-relaxed">
                    {direito.descricao}
                  </p>
                  {direito.fonte_oficial && (
                    <Badge variant="secondary" className="mt-3 font-body text-xs">
                      Fonte: {direito.fonte_oficial}
                    </Badge>
                  )}
                  {direito.link_externo && (
                    <div className="mt-4">
                      <a
                        href={direito.link_externo}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm" className="gap-2 rounded-xl font-body">
                          <ExternalLink className="w-4 h-4" />
                          Saiba mais
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </Card>
            </motion.div>
          ))}
        </div>
      )}
    <DireitosChat />
    </div>
  );
}
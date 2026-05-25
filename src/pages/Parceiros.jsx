import React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Handshake, Tag, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isPast } from "date-fns";

export default function Parceiros() {
  const { data: parceiros, isLoading } = useQuery({
    queryKey: ["parceiros"],
    queryFn: () => base44.entities.Parceiro.list(),
    initialData: [],
  });

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
        <h1 className="text-2xl font-heading font-bold text-foreground">Parceiros da Comunidade</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">
          Descontos e ofertas exclusivas para você
        </p>
      </div>

      {parceiros.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Handshake className="w-10 h-10 text-primary" />
          </div>
          <h3 className="font-heading font-bold text-foreground mb-2">Nenhum parceiro cadastrado</h3>
          <p className="text-sm text-muted-foreground font-body">
            Em breve, empresas parceiras com ofertas especiais estarão disponíveis aqui.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {parceiros.map((parceiro, i) => {
            const expired = parceiro.validade && isPast(new Date(parceiro.validade));
            return (
              <motion.div
                key={parceiro.id}
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.07 }}
              >
              <Card className={`p-6 ${expired ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Tag className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-bold text-foreground">{parceiro.nome_empresa}</h3>
                      {expired && (
                        <Badge variant="secondary" className="text-xs">Expirado</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-body mt-2">
                      {parceiro.descricao_oferta}
                    </p>
                    {parceiro.validade && (
                      <p className="text-xs text-muted-foreground font-body mt-3 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        Válido até {format(new Date(parceiro.validade), "dd/MM/yyyy")}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
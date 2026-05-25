import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Baby, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ["#FF2E88", "#FF7EB6", "#f97316", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"];
const CATEGORIAS = ["Alimentação","Saúde","Educação","Transporte","Lazer","Roupas","Casa","Outros"];

export default function ResumoMensal() {
  const { user } = useAuth();

  const { data: despesas } = useQuery({
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

  // Monthly totals (last 6 months)
  const monthlyData = useMemo(() => {
    const map = {};
    despesas.forEach((d) => {
      if (!d.data) return;
      const key = d.data.slice(0, 7); // "YYYY-MM"
      map[key] = (map[key] || 0) + (d.valor || 0);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, total]) => ({
        mes: format(parseISO(key + "-01"), "MMM/yy", { locale: ptBR }),
        total,
      }));
  }, [despesas]);

  // Per-category totals
  const perCategoriaData = useMemo(() => {
    const map = {};
    despesas.forEach((d) => {
      const key = d.categoria || "Outros";
      map[key] = (map[key] || 0) + (d.valor || 0);
    });
    return CATEGORIAS
      .filter((c) => map[c])
      .map((c, i) => ({ name: c, value: map[c], fill: COLORS[i % COLORS.length] }));
  }, [despesas]);

  // Per-child totals
  const perChildData = useMemo(() => {
    const map = {};
    despesas.forEach((d) => {
      const key = d.filho_nome || "Sem vínculo";
      map[key] = (map[key] || 0) + (d.valor || 0);
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([nome, total]) => ({ nome, total }));
  }, [despesas]);

  const totalGeral = despesas.reduce((s, d) => s + (d.valor || 0), 0);

  const fmt = (v) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  return (
    <div className="space-y-6">
      {/* Total card */}
      <Card className="p-6 bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm opacity-90 font-body">Total registrado</p>
            <p className="text-2xl font-heading font-bold">{fmt(totalGeral)}</p>
          </div>
        </div>
      </Card>

      {/* Monthly chart */}
      {monthlyData.length > 0 && (
        <Card className="p-6">
          <h3 className="font-heading font-bold text-foreground mb-4">Gastos por Mês</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barSize={32}>
              <XAxis dataKey="mes" tick={{ fontSize: 12, fontFamily: "var(--font-body)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fontFamily: "var(--font-body)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
              <Tooltip
                formatter={(v) => [fmt(v), "Total"]}
                contentStyle={{ borderRadius: 12, fontFamily: "var(--font-body)", fontSize: 13 }}
              />
              <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                {monthlyData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Category pie chart */}
      {perCategoriaData.length > 0 && (
        <Card className="p-6">
          <h3 className="font-heading font-bold text-foreground mb-4">Gastos por Categoria</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={perCategoriaData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {perCategoriaData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [fmt(v), "Total"]} contentStyle={{ borderRadius: 12, fontFamily: "var(--font-body)", fontSize: 13 }} />
              <Legend formatter={(v) => <span style={{ fontFamily: "var(--font-body)", fontSize: 12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {perCategoriaData.map(({ name, value, fill }, i) => {
              const pct = totalGeral > 0 ? (value / totalGeral) * 100 : 0;
              return (
                <div key={name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-body text-foreground flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: fill }} />
                      {name}
                    </span>
                    <span className="text-xs font-heading font-bold text-foreground">{fmt(value)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: fill }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Per child breakdown */}
      <Card className="p-6">
        <h3 className="font-heading font-bold text-foreground mb-4">Gastos por Filho</h3>
        {perChildData.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body">Nenhuma despesa registrada.</p>
        ) : (
          <div className="space-y-3">
            {perChildData.map(({ nome, total }, i) => {
              const pct = totalGeral > 0 ? (total / totalGeral) * 100 : 0;
              return (
                <div key={nome}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: COLORS[i % COLORS.length] + "22" }}>
                        <Baby className="w-3.5 h-3.5" style={{ color: COLORS[i % COLORS.length] }} />
                      </div>
                      <span className="text-sm font-body font-medium text-foreground">{nome}</span>
                    </div>
                    <span className="text-sm font-heading font-bold text-foreground">{fmt(total)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
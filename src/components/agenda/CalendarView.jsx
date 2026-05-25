import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Baby, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isSameMonth, format, addMonths, subMonths
} from "date-fns";
import { ptBR } from "date-fns/locale";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function CalendarView({ compromissos }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getEvents = (day) =>
    compromissos.filter((c) => isSameDay(new Date(c.data_horario), day));

  const selectedEvents = selectedDay ? getEvents(selectedDay) : [];

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-xl hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="font-heading font-bold text-foreground capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-xl hover:bg-secondary transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar grid */}
      <Card className="p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground font-body py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const events = getEvents(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(isSameDay(day, selectedDay) ? null : day)}
                className={`
                  relative flex flex-col items-center rounded-xl py-2 px-1 transition-all min-h-[52px]
                  ${!isCurrentMonth ? "opacity-30" : ""}
                  ${isSelected ? "bg-primary text-primary-foreground" : isToday ? "bg-primary/10 text-primary" : "hover:bg-secondary"}
                `}
              >
                <span className={`text-sm font-body font-medium`}>
                  {format(day, "d")}
                </span>
                {events.length > 0 && (
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                    {events.slice(0, 3).map((_, idx) => (
                      <span
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected day events */}
      {selectedDay && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h3 className="font-heading font-bold text-foreground text-sm">
            {format(selectedDay, "dd 'de' MMMM", { locale: ptBR })}
            {" — "}
            {selectedEvents.length === 0
              ? "Nenhum compromisso"
              : `${selectedEvents.length} compromisso(s)`}
          </h3>
          {selectedEvents.map((item) => (
            <Card key={item.id} className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-body font-medium text-foreground">{item.descricao}</p>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground font-body">
                  <span className="flex items-center gap-1">
                    <Baby className="w-3 h-3" /> {item.filho_nome}
                  </span>
                  <span>{format(new Date(item.data_horario), "HH:mm")}</span>
                </div>
              </div>
            </Card>
          ))}
        </motion.div>
      )}
    </div>
  );
}
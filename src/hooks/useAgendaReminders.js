import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

const SENT_KEY = "rede_solo_sent_reminders";

function getSentReminders() {
  try {
    return JSON.parse(localStorage.getItem(SENT_KEY) || "{}");
  } catch {
    return {};
  }
}

function markSent(key) {
  const sent = getSentReminders();
  sent[key] = Date.now();
  // Clean old entries (> 48h)
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  Object.keys(sent).forEach((k) => {
    if (sent[k] < cutoff) delete sent[k];
  });
  localStorage.setItem(SENT_KEY, JSON.stringify(sent));
}

function wasSent(key) {
  return !!getSentReminders()[key];
}

function notify(title, body) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  new Notification(title, { body, icon: "/favicon.ico" });
}

export default function useAgendaReminders(userEmail, onInAppAlert) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!userEmail) return;

    async function checkReminders() {
      const now = new Date();

      const compromissos = await base44.entities.AgendaCrianca.filter(
        { created_by: userEmail },
        "data_horario"
      );

      compromissos.forEach((item) => {
        const dt = new Date(item.data_horario);
        const diffMs = dt - now;
        const diffMin = diffMs / 60000;

        // 30min in-app alert (between 28min and 32min)
        if (diffMin > 0 && diffMin <= 32 && diffMin >= 28) {
          const key = `30min_${item.id}`;
          if (!wasSent(key)) {
            if (onInAppAlert) {
              onInAppAlert({
                id: item.id,
                filho_nome: item.filho_nome,
                descricao: item.descricao,
                hora: dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
              });
            }
            notify(
              `⏰ Compromisso em 30 minutos — ${item.filho_nome}`,
              `"${item.descricao}" começa às ${dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.`
            );
            markSent(key);
          }
        }

        // 24h reminder (between 23h55 and 24h05)
        if (diffMin > 0 && diffMin <= 24 * 60 + 5 && diffMin >= 24 * 60 - 5) {
          const key = `24h_${item.id}`;
          if (!wasSent(key)) {
            notify(
              `⏰ Compromisso amanhã — ${item.filho_nome}`,
              `"${item.descricao}" está marcado para amanhã às ${dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.`
            );
            markSent(key);
          }
        }

        // 1h reminder (between 55min and 65min)
        if (diffMin > 0 && diffMin <= 65 && diffMin >= 55) {
          const key = `1h_${item.id}`;
          if (!wasSent(key)) {
            notify(
              `🔔 Compromisso em 1 hora — ${item.filho_nome}`,
              `"${item.descricao}" começa em aproximadamente 1 hora.`
            );
            markSent(key);
          }
        }

        // 15min reminder
        if (diffMin > 0 && diffMin <= 17 && diffMin >= 13) {
          const key = `15min_${item.id}`;
          if (!wasSent(key)) {
            notify(
              `🚨 Compromisso em 15 minutos — ${item.filho_nome}`,
              `"${item.descricao}" começa em breve!`
            );
            markSent(key);
          }
        }
      });
    }

    checkReminders();
    intervalRef.current = setInterval(checkReminders, 60 * 1000);

    return () => clearInterval(intervalRef.current);
  }, [userEmail]);
}
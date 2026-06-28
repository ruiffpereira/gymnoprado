import { useEffect, useState } from "react";
import { CalendarDays, Copy, Check, Download, Clock } from "lucide-react";
import { useCalendarPrefs, useSaveCalendarPrefs, type CalendarPrefs } from "../api/calendar";
import { Card, Button, Stepper, Spinner, Empty } from "../components/ui";
import { useScreenHeader } from "../store/useHeader";
import { useCms } from "../context/CmsContext";
import { toast } from "../lib/toast";

/**
 * "Treinos no calendário" — o cliente escolhe a(s) hora(s) de treino e subscreve
 * um feed .ics gerado a partir do programa ativo. Todos os textos vêm do CMS via
 * useCms().t() com fallback PT hardcoded (o t() devolve '' para chaves em falta).
 */

const WEEKDAY_KEYS = [
  "gym.app.calendar.day.mon",
  "gym.app.calendar.day.tue",
  "gym.app.calendar.day.wed",
  "gym.app.calendar.day.thu",
  "gym.app.calendar.day.fri",
  "gym.app.calendar.day.sat",
  "gym.app.calendar.day.sun",
];
const WEEKDAY_FALLBACK = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
// Índice do dia (0=Dom..6=Sáb) para cada posição Seg..Dom acima.
const WEEKDAY_INDEX = [1, 2, 3, 4, 5, 6, 0];

export function CalendarSync() {
  const { t } = useCms();
  const tr = (key: string, fb: string) => t(key) || fb;

  useScreenHeader({ title: tr("gym.app.calendar.title", "Treinos no calendário") });

  const { data, isLoading } = useCalendarPrefs();
  const save = useSaveCalendarPrefs();

  // Estado local editável (sincroniza com o servidor ao carregar).
  const [weekdayTimes, setWeekdayTimes] = useState<Record<string, string>>({});
  const [defaultTime, setDefaultTime] = useState("18:00");
  const [freeDays, setFreeDays] = useState(3);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!data) return;
    setWeekdayTimes(data.weekdayTimes ?? {});
    setDefaultTime(data.defaultTime ?? "18:00");
    setFreeDays(data.freeDays ?? 3);
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const prefs = data as CalendarPrefs | undefined;

  const onSave = async () => {
    try {
      await save.mutateAsync({ weekdayTimes, defaultTime, freeDays });
      toast.success(tr("gym.app.calendar.saved", "Preferências guardadas"));
    } catch {
      toast.error(tr("gym.app.calendar.save_error", "Não foi possível guardar"));
    }
  };

  const copyUrl = async () => {
    if (!prefs?.webcalUrl) return;
    try {
      await navigator.clipboard.writeText(prefs.webcalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(tr("gym.app.calendar.copy_error", "Não foi possível copiar"));
    }
  };

  // Mensagens de estado (sem plano / terminou / bloqueado).
  const stateMessage =
    prefs?.status === "blocked"
      ? tr("gym.app.calendar.blocked", "A tua mensalidade está suspensa. Regulariza para ver os treinos no calendário.")
      : prefs?.status === "no_plan"
        ? tr("gym.app.calendar.no_plan", "Ainda não tens um plano ativo. Quando o teu treinador atribuir um, os treinos aparecem aqui.")
        : prefs?.status === "ended"
          ? tr("gym.app.calendar.ended", "O teu plano terminou. Fala com o teu treinador para um novo.")
          : null;

  return (
    <div className="animate-fadeIn px-5 lg:px-9 py-6 max-w-2xl mx-auto">
      {/* Hero */}
      <Card className="p-5 mb-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex w-11 h-11 rounded-xl bg-brand-lt items-center justify-center text-brand shrink-0">
            <CalendarDays size={22} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-black text-t1">{tr("gym.app.calendar.title", "Treinos no calendário")}</h2>
            <p className="text-[13px] text-t2 leading-relaxed mt-1">
              {tr(
                "gym.app.calendar.intro",
                "Escolhe a hora dos teus treinos e adiciona-os ao teu calendário (Google, Apple, etc.).",
              )}
            </p>
          </div>
        </div>
      </Card>

      {stateMessage && (
        <Card className="p-4 mb-5">
          <Empty title={tr("gym.app.calendar.no_events_title", "Sem treinos a mostrar")} subtitle={stateMessage} />
        </Card>
      )}

      {/* Preferências de hora */}
      <Card className="p-5 mb-5">
        <p className="text-sm font-bold text-t1 mb-3 flex items-center gap-2">
          <Clock size={16} className="text-t3" /> {tr("gym.app.calendar.times_title", "Horas de treino")}
        </p>

        {prefs?.mode === "free" ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-t2">{tr("gym.app.calendar.per_week", "Treinos por semana")}</span>
            <Stepper value={freeDays} onChange={setFreeDays} min={1} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {WEEKDAY_INDEX.map((dayIdx, i) => (
              <label key={dayIdx} className="flex items-center justify-between gap-2 rounded-btn border-2 border-line bg-bg px-3 py-2">
                <span className="text-[13px] font-semibold text-t2">{tr(WEEKDAY_KEYS[i], WEEKDAY_FALLBACK[i])}</span>
                <input
                  type="time"
                  value={weekdayTimes[String(dayIdx)] ?? ""}
                  onChange={(e) =>
                    setWeekdayTimes((prev) => {
                      const next = { ...prev };
                      if (e.target.value) next[String(dayIdx)] = e.target.value;
                      else delete next[String(dayIdx)];
                      return next;
                    })
                  }
                  className="bg-transparent text-[14px] text-t1 outline-none tnum"
                />
              </label>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-line">
          <span className="text-sm text-t2">{tr("gym.app.calendar.default_time", "Hora por defeito")}</span>
          <input
            type="time"
            value={defaultTime}
            onChange={(e) => setDefaultTime(e.target.value)}
            className="rounded-btn border-2 border-line bg-bg px-3 py-2 text-[14px] text-t1 outline-none tnum"
          />
        </div>

        <Button fullWidth className="mt-4" onClick={onSave} disabled={save.isPending}>
          {save.isPending ? <Spinner className="h-4 w-4" /> : tr("gym.app.calendar.save", "Guardar")}
        </Button>
      </Card>

      {/* Subscrição / adicionar ao calendário */}
      <Card className="p-5">
        <p className="text-sm font-bold text-t1 mb-1">{tr("gym.app.calendar.subscribe_title", "Subscrever calendário")}</p>
        <p className="text-[13px] text-t2 leading-relaxed mb-3">
          {tr(
            "gym.app.calendar.subscribe_help",
            "Copia o link e adiciona-o no Google Calendar (Outros calendários → Por URL) ou no Apple Calendar (Ficheiro → Nova subscrição).",
          )}
        </p>

        <div className="flex items-center gap-2 rounded-btn border-2 border-line bg-bg px-3 py-2 mb-3">
          <span className="flex-1 text-[12px] text-t2 truncate tnum">{prefs?.webcalUrl ?? ""}</span>
          <button
            onClick={copyUrl}
            className="shrink-0 inline-flex items-center gap-1 text-[12px] font-bold text-brand"
            aria-label={tr("gym.app.calendar.copy", "Copiar")}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? tr("gym.app.calendar.copied", "Copiado") : tr("gym.app.calendar.copy", "Copiar")}
          </button>
        </div>

        {prefs?.url && (
          <a href={prefs.url} target="_blank" rel="noopener noreferrer">
            <Button fullWidth variant="outline" icon={<Download size={16} />}>
              {tr("gym.app.calendar.add", "Adicionar ao calendário")}
            </Button>
          </a>
        )}
      </Card>
    </div>
  );
}

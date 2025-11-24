import {
  differenceInHours,
  differenceInMinutes,
  format,
  isValid,
  parseISO,
} from "date-fns";

/**
 * Calcula o tempo decorrido entre uma data/hora e a data/hora atual
 * @param date - Data e hora a ser comparada (Date ou string)
 * @returns String formatada com o tempo decorrido
 */
export function getTimeAgo(
  date: Date | string | undefined,
  suffix: string = "",
): string {
  if (!date) {
    return "agora";
  }
  const now = new Date();
  const pastDate = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(pastDate)) {
    return `${format(new Date(), "dd/MM HH:mm")}`;
  }

  const diffMinutes = differenceInMinutes(now, pastDate);

  if (diffMinutes < 0) {
    return `${format(pastDate, "dd/MM HH:mm")}`;
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? "minuto" : "minutos"} ${suffix}`;
  }

  const diffHours = differenceInHours(now, pastDate);

  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "hora" : "horas"} ${suffix} `;
  }

  return `${format(pastDate, "dd/MM HH:mm")}`;
}

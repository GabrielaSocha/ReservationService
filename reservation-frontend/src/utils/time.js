export function yyyyMmDd(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

export function toIsoLocal(dateStr, timeStr) {
    return `${dateStr}T${timeStr}:00`;
}

export function fmtTime(dtStr) {
    const t = dtStr.split("T")[1] || "";
    return t.slice(0, 5);
}
export function fmtLocalDateTime(dtStr) {
  if (!dtStr) return "";

  const hasZone = /Z$|[+-]\d\d:\d\d$/.test(dtStr);

  if (hasZone) {
    const d = new Date(dtStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  }

  return dtStr.replace("T", " ").slice(0, 16);
}

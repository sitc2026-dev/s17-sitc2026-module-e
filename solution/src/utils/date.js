/** Format like example: 2026/8/7 10:46:42 in Asia/Shanghai */
export function formatShanghaiDateTime(date = new Date()) {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type) => parts.find((p) => p.type === type)?.value ?? "";
  const year = get("year");
  const month = String(Number(get("month")));
  const day = String(Number(get("day")));
  const hour = String(Number(get("hour")));
  const minute = get("minute").padStart(2, "0");
  const second = get("second").padStart(2, "0");

  return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
}

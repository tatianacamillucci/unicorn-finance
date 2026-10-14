export function monthDateRange(month: string): { startDate: string; endDate: string } {
  const [year, monthNum] = month.split("-").map(Number);
  const startDate = `${month}-01`;
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const endDate = `${month}-${String(daysInMonth).padStart(2, "0")}`;
  return { startDate, endDate };
}

export function getNext30Days() {
  const days = [];
  const today = new Date();
  
  for (let i = -1; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    let dayName = new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(date).toUpperCase();
    if (i === -1) dayName = "KEMARIN";
    else if (i === 0) dayName = "HARI INI";
    const dateNum = date.getDate();
    const monthName = new Intl.DateTimeFormat("id-ID", { month: "short" }).format(date).toUpperCase();
    const fullMonth = new Intl.DateTimeFormat("id-ID", { month: "long" }).format(date);
    const year = date.getFullYear();

    days.push({
      dayName,
      dateNum,
      month: monthName,
      fullMonth,
      year,
      fullDate: date.toISOString().split('T')[0]
    });
  }
  
  return days;
}

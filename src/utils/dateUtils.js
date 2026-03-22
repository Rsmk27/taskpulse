import dayjs from 'dayjs';

export const getTodayStr = () => dayjs().format('YYYY-MM-DD');

export const getYesterdayStr = () => dayjs().subtract(1, 'day').format('YYYY-MM-DD');

export const combineDatetime = (dateStr, timeStr) =>
  dayjs(`${dateStr} ${timeStr}`, 'YYYY-MM-DD HH:mm');

export const isInFuture = (dateStr, timeStr) =>
  combineDatetime(dateStr, timeStr).isAfter(dayjs());

export const isToday = (dateStr) => dateStr === getTodayStr();

export const isYesterday = (dateStr) => dateStr === getYesterdayStr();

export const minutesUntil = (dateStr, timeStr) =>
  combineDatetime(dateStr, timeStr).diff(dayjs(), 'minute');

export const formatDisplayTime = (timeStr) =>
  dayjs(`2000-01-01 ${timeStr}`).format('h:mm A');

export const formatDisplayDate = (dateStr) =>
  dayjs(dateStr).format('ddd, MMM D');

export const getGreeting = () => {
  const h = dayjs().hour();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export const minutesFromNow = (n) => dayjs().add(n, 'minute').toDate();

export const isInQuietWindow = (startStr, endStr) => {
  const now = dayjs();
  const start = dayjs(`${getTodayStr()} ${startStr}`, 'YYYY-MM-DD HH:mm');
  let end = dayjs(`${getTodayStr()} ${endStr}`, 'YYYY-MM-DD HH:mm');
  if (end.isBefore(start)) end = end.add(1, 'day');
  return now.isAfter(start) && now.isBefore(end);
};

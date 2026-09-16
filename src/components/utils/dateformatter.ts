const showDateOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

const showDateWithSuffixOptions: Intl.DateTimeFormatOptions = {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
};

export function showDate(date: Date) {
  return date.toLocaleString('en-US', showDateOptions);
}

export function showDateWithSuffix(date: Date) {
  const formattedDate = date.toLocaleDateString(
    'en-US',
    showDateWithSuffixOptions,
  );

  // Extract the day without leading zeros
  const day = date.getDate();
  // Handle special cases for 'th' suffix
  const daySuffix =
    day >= 11 && day <= 13
      ? 'th'
      : day % 10 === 1
      ? 'st'
      : day % 10 === 2
      ? 'nd'
      : day % 10 === 3
      ? 'rd'
      : 'th';

  // Replace the day in the formatted date with the formatted day
  return formattedDate.replace(/\d+/, day + daySuffix);
}

export function showFullDate(date: Date) {
  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  // Get day, month, and year components from the Date object
  const dayOfWeek = daysOfWeek[date.getDay()];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  // Format the date string
  const formattedDate = `${dayOfWeek} ${month} ${day}, ${year}`;

  return formattedDate;
}

export function showDateHtml(dateParam: any) {
  let date;
  if (
    typeof dateParam === 'string' &&
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z)$/.test(dateParam)
  ) {
    date = new Date(dateParam);
  } else if (dateParam && 'seconds' in dateParam) {
    const seconds = dateParam.seconds;
    const nanoseconds = dateParam.nanoseconds;
    date = new Date(seconds * 1000 + nanoseconds / 1e6);
  } else if (dateParam && '_seconds' in dateParam) {
    const seconds = dateParam._seconds;
    const nanoseconds = dateParam._nanoseconds;
    date = new Date(seconds * 1000 + nanoseconds / 1e6);
  } else {
    date = undefined;
  }

  const day = date?.toLocaleString('default', { day: '2-digit' });
  const month = date?.toLocaleString('default', { month: 'short' });
  const year = date?.toLocaleString('default', { year: 'numeric' });

  let formattedDate;
  if (day && month && year) {
    const currentDate = new Date();
    const inputDate = new Date(`${year}-${month}-${day}`);

    if (inputDate < currentDate) {
      formattedDate = `<span style="color: red;">${day} ${month} ${year}</span>`;
    } else {
      formattedDate = `${day} ${month} ${year}`;
    }
  } else {
    formattedDate = '<span>No due date</span>';
  }
  return formattedDate;
}

export function showDatePickerValue(dateParam: any) {
  let date;
  if (
    typeof dateParam === 'string' &&
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z)$/.test(dateParam)
  ) {
    date = new Date(dateParam);
  } else if (dateParam && 'seconds' in dateParam) {
    const seconds = dateParam.seconds;
    const nanoseconds = dateParam.nanoseconds;
    date = new Date(seconds * 1000 + nanoseconds / 1e6);
  } else if (dateParam && '_seconds' in dateParam) {
    const seconds = dateParam._seconds;
    const nanoseconds = dateParam._nanoseconds;
    date = new Date(seconds * 1000 + nanoseconds / 1e6);
  } else {
    date = undefined;
  }

  return date;
}

export function formatDate(date: any) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' } as any;
  return new Date(date.seconds * 1000).toLocaleDateString('en-US', options);
}

export function getDateStatus(dateObj: any) {
  const date = new Date(dateObj.seconds * 1000);
  const today = new Date();

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) {
    return 'Today';
  } else if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US');
  }
}

function isSameDay(date1: any, date2: any) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

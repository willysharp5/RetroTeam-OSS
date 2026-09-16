import DatePicker from 'react-tailwindcss-datepicker';

export default function DatePickerRange(props: any) {
  function getLastDayOfYear(): string {
    const today: Date = new Date();
    const year: number = today.getFullYear();
    const formattedLastDay: string = year + '-12-31';
    return formattedLastDay;
  }
  function getFirstDayOfYear(): string {
    const today: Date = new Date();
    const year: number = today.getFullYear();
    const formattedFirstDay: string = year + '-01-01';
    return formattedFirstDay;
  }

  function getLastYearLastDay(): string {
    const today: Date = new Date();
    const year: number = today.getFullYear();
    const formattedLastDay: string = year - 1 + '-12-31';
    return formattedLastDay;
  }

  function getLastYearFirstDay(): string {
    const today: Date = new Date();
    const year: number = today.getFullYear();
    const formattedFirstDay: string = year - 1 + '-01-01';
    return formattedFirstDay;
  }

  const thisYearFirstDay: string = getFirstDayOfYear();
  const thisYearLastDay: string = getLastDayOfYear();
  const lastYearFirstDay = getLastYearFirstDay();
  const lastYearLastDay = getLastYearLastDay();

  return (
    <div>
      <DatePicker
        value={props.value}
        onChange={props.handleValueChange}
        showShortcuts
        readOnly
        primaryColor="orange"
        inputClassName="h-10 w-full text-xs
        rounded-md border border-[#E4E4E7] bg-white py-1.5 pl-2.5 pr-10 md:py-2 md:pl-4 md:pr-14 ring-offset-1 transition-all
        duration-300 placeholder:text-gray-400
        disabled:cursor-not-allowed
        disabled:opacity-50"
        separator="-"
        popoverDirection="down"
        configs={{
          shortcuts: {
            today: 'Today',
            yesterday: 'Yesterday',
            past: (period) => `Last ${period} days`,
            currentMonth: 'This month',
            pastMonth: 'Last Month',
            thisYear: {
              text: 'This Year',
              period: {
                start: thisYearFirstDay,
                end: thisYearLastDay,
              },
            },
            lastYear: {
              text: 'Last Year',
              period: {
                start: lastYearFirstDay,
                end: lastYearLastDay,
              },
            },
          },
        }}
      />
    </div>
  );
}

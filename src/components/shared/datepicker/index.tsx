import React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import TextField from '@mui/material/TextField';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  DatePicker,
  DatePickerFieldProps,
} from '@mui/x-date-pickers/DatePicker';
import { useValidation, validateDate } from '@mui/x-date-pickers/validation';
import {
  useSplitFieldProps,
  usePickersContext,
} from '@mui/x-date-pickers/hooks';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { FieldChangeHandlerContext } from '@mui/x-date-pickers/internals';
import { DateValidationError } from '@mui/x-date-pickers';

import calendar from '/public/assets/svg/calendar.svg';
import Image from 'next/image';

function ReadOnlyDateField(props: DatePickerFieldProps<Dayjs, false>) {
  const { internalProps, forwardedProps } = useSplitFieldProps(props, 'date');
  const { value, timezone, format, onChange } = internalProps;
  const { InputProps, slotProps, slots, ...other } = forwardedProps;

  const pickersContext = usePickersContext();

  const { hasValidationError } = useValidation({
    validator: validateDate,
    value,
    timezone,
    props: internalProps,
  });

  const handleTogglePicker = (event: React.UIEvent) => {
    if (pickersContext.open) {
      pickersContext.onClose(event);
    } else {
      pickersContext.onOpen(event);
    }
  };

  const handleClear = () => {
    if (onChange) {
      const context: FieldChangeHandlerContext<DateValidationError> = {
        validationError: null,
      };
      onChange(null, context);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = value ? new Date(value as any) : value;

  const isPastDate = selectedDate
    ? new Date(selectedDate.setHours(0, 0, 0, 0)) < today
    : false;

  return (
    <TextField
      {...other}
      value={value == null ? '' : value.format(format)}
      placeholder={'Enter Date'}
      InputProps={{
        ...InputProps,
        readOnly: true,
        style: {
          padding: '.5rem'
        },
        endAdornment: (
          <>
            {value && (
              <button disabled={props.disabled} onClick={handleClear}>
                <XCircleIcon className="text-black mr-2 h-4 w-4" />
              </button>
            )}
            <button disabled={props.disabled}>
              <Image
                src={calendar}
                className="text-black mr-2 h-4 w-4"
                alt="calendar"
              ></Image>
            </button>
          </>
        ),
        sx: {
          cursor: 'pointer',
          backgroundColor: isPastDate ? '#FEE2E2' : 'transparent',
          fontSize: '.75rem',
          '& .MuiInputBase-input': {
            padding: 0,
          },
          '& *': { cursor: 'inherit' },
        },
        disabled: props.disabled,
      }}
      error={hasValidationError}
      onClick={handleTogglePicker}
    />
  );
}

function ReadOnlyFieldDatePicker(props: any) {
  const isValidDate =
    props.selectedDate && props.selectedDate != ''
      ? dayjs(props.selectedDate)
      : null;

  return (
    <DatePicker
      {...props}
      value={isValidDate}
      onChange={(value: any) => {
        if (value) {
          props.setSelectedDate(new Date(value));
        } else {
          props.setSelectedDate(value);
        }
      }}
      slots={{ ...props.slots, field: ReadOnlyDateField }}
      format="DD MMM YYYY"
      sx={
        {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#E4E4E7'
          },
          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#E4E4E7'
          },
          '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#E4E4E7'
          },
        }
      }
    />
  );
}

interface CustomDatePickerProps {
  selectedDate: any;
  setSelectedDate: (date: any) => void;
  disabled?: boolean;
}

export default function CustomDatePicker({
  selectedDate,
  setSelectedDate,
  disabled = false,
}: CustomDatePickerProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ReadOnlyFieldDatePicker
        setSelectedDate={setSelectedDate}
        disabled={disabled}
        selectedDate={selectedDate}
      />
    </LocalizationProvider>
  );
}

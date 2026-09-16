import Image from 'next/image';

import Sidebar from '~/core/ui/SideBarComponent';

import plus from 'public/assets/svg/plus-circled-black.svg';
import x from 'public/assets/svg/x.svg';
import minus from 'public/assets/svg/minus-circle.svg';
import music from 'public/assets/svg/music.svg';
import none from 'public/assets/svg/value-none.svg';

import play from 'public/assets/svg/play-circle.svg';

import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '~/core/ui/Select';
import { SelectIcon } from '@radix-ui/react-select';
import { useCallback, useEffect, useState } from 'react';
import { useSetTimer } from '~/lib/board/hooks/use-set-timer';
import { usePatchOrganization } from '~/lib/organizations/hooks/use-patch-organization';

interface Sound {
  name: string;
  value: string;
  icon: any;
  sound: string;
}

interface TimerSidebarProps {
  organizationId: string;
  retrospectiveId: string;
  setShowTimerSidebar: (show: boolean) => void;
  setMinute: (minute: number) => void;
  minute: number;
  second: number;
  setSecond: (second: number) => void;
  sound: any;
  setSound: (sound: any) => void;
  setPlay: (play: boolean) => void;
  setPause: (pause: boolean) => void;
}
interface Sound {
  name: string;
  value: string;
  icon: any;
  sound: string;
}
const soundOptions = [
  {
    name: 'Train',
    value: 'train',
    icon: music,
    sound: '/assets/sounds/train.mp3',
  },
  {
    name: 'Telephone Ring',
    value: 'telephone-ring',
    icon: music,
    sound: '/assets/sounds/ring.mp3',
  },
  {
    name: 'Bell Ring',
    value: 'bell',
    icon: music,
    sound: '/assets/sounds/bell.mp3',
  },
  {
    name: 'None',
    value: 'none',
    icon: none,
    sound: 'none',
  },
] as Sound[];

const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US', { minimumIntegerDigits: 2 });
};

export default function TimerSidebar({
  setShowTimerSidebar,
  minute,
  setMinute,
  second,
  setSecond,
  sound,
  setSound,
  setPlay,
  setPause,
  organizationId,
  retrospectiveId,
}: TimerSidebarProps) {
  const [displayMinute, setDisplayMinute] = useState<string>(
    formatNumber(Number(minute)),
  );

  const [displaySecond, setDisplaySecond] = useState<string>(
    formatNumber(Number(second)),
  );

  function incrementMinute() {
    let display = minute as any;
    if (typeof minute === 'string') {
      setMinute(6);
      display = 6;
    } else if (isNaN(minute)) {
      setMinute(0);
      display = 0;
    } else if (minute < 60) {
      setMinute(minute + 1);
      display = minute + 1;
    }
    setDisplayMinute(formatNumber(display));
  }

  function decrementMinute() {
    let display = minute as any;
    if (minute > 0) {
      setMinute(minute - 1);
      display = minute - 1;
    }
    if (isNaN(minute)) {
      setMinute(0);
      display = 0;
    }
    setDisplayMinute(
      display.toLocaleString('en-US', { minimumIntegerDigits: 2 }),
    );
  }

  function incrementSecond() {
    let display = second as any;
    if (typeof second === 'string') {
      setSecond(1);
      display = 1;
    } else if (isNaN(second)) {
      setSecond(0);
      display = 0;
    } else if (second < 60) {
      display = second + 1;
      setSecond(second + 1);
    }
    setDisplaySecond(
      display.toLocaleString('en-US', { minimumIntegerDigits: 2 }),
    );
  }

  function decrementSecond() {
    let display = second as any;
    if (isNaN(second)) {
      setSecond(0);
      display = 0;
    }
    if (second > 0) {
      setSecond(second - 1);
      display = second - 1;
    }
    setDisplaySecond(
      display.toLocaleString('en-US', { minimumIntegerDigits: 2 }),
    );
  }

  // TIMER FUNCTIONS
  const updateTimer = useSetTimer();
  const { patchOrganization } = usePatchOrganization(organizationId);

  // Update the timer in Firestore when minute, second, play, or pause changes
  const onSetTimer = useCallback(
    async (play: boolean, pause: boolean, show: boolean) => {
      if (retrospectiveId) {
        updateTimer(
          organizationId,
          retrospectiveId,
          minute.toString(),
          second.toString(),
          play,
          pause,
          show,
          sound,
        )
          .then((res) => {
            if (res?.success) {
              if (play) setShowTimerSidebar(false);
            }
          })
          .catch((e) => {
            console.error('Error updating timer', e);
          });
      } else {
        patchOrganization({
          minute: minute.toString(),
          second: second.toString(),
          play,
          pause,
          showTimerModal: show,
          sound,
        }).then(() => {
          if (play) setShowTimerSidebar(false);
        });
      }
    },
    [
      retrospectiveId,
      minute,
      second,
      organizationId,
      sound,
      updateTimer,
      setShowTimerSidebar,
      patchOrganization,
    ],
  );

  useEffect(() => {
    onSetTimer(false, true, false);
  }, []);

  return (
    <Sidebar>
      <div className="w-full md:w-[350px] tv:w-[400px] z-50 bg-white h-full shadow-md border-l fixed top-0 right-0 overflow-y-auto p-6">
        <div className="flex justify-between">
          <p className="text-sm font-black">Timer</p>
          <Image
            className="h-6 w-6 cursor-pointer"
            src={x}
            alt="x"
            onClick={() => {
              setShowTimerSidebar(false);
              setPause(false);
            }}
          ></Image>
        </div>
        <div className="bg-gray-100 text-base shadow-sm text-black font-semibold mt-4 border border-[#E4E4E7] rounded-md p-6">
          <p className="font-normal text-center text-[#71717A] text-sm mt-1.5">
            Set the Timer (Max 60 : 00)
          </p>
          <div className="flex justify-center mt-1.5 w-full">
            <div className="text-4xl space-x-2 flex items-center">
              <button onClick={decrementMinute}>
                <Image className="h-4 w-4" src={minus} alt="minus"></Image>
              </button>
              <div>
                <input
                  value={displayMinute}
                  onChange={(e) => {
                    let newValue = e.target.value;

                    if (newValue.length > 2) {
                      return;
                    } else {
                      let numericValue = parseInt(newValue);

                      numericValue = Math.min(numericValue, 60);

                      setMinute(numericValue);

                      setDisplayMinute(numericValue as any);
                    }
                  }}
                  className="w-[50px] text-center border-none outline-none bg-transparent focus:outline-none appearance-none"
                  type="number"
                  min={0}
                  max={60}
                  id="no-spinners"
                />
              </div>
              <button onClick={incrementMinute}>
                <Image className="h-4 w-4" src={plus} alt="plus"></Image>
              </button>

              <p>:</p>
              <button onClick={decrementSecond}>
                <Image className="h-4 w-4" src={minus} alt="minus"></Image>
              </button>

              <input
                value={displaySecond}
                onChange={(e) => {
                  let newValue = e.target.value;

                  if (newValue.length > 2) {
                    return;
                  } else {
                    let numericValue = parseInt(newValue);

                    numericValue = Math.min(numericValue, 60);

                    setSecond(numericValue);
                    setDisplaySecond(numericValue as any);
                  }
                }}
                className="w-[50px] text-center border-none outline-none bg-transparent focus:outline-none appearance-none"
                type="number"
                min={0}
                max={60}
                id="no-spinners"
              />
              <button onClick={incrementSecond}>
                <Image className="h-4 w-4" src={plus} alt="plus"></Image>
              </button>
            </div>
          </div>

          <div className="space-y-6 mt-6 w-full ">
            <div className="flex space-x-2 font-sm font-normal">
              <Select
                value={sound}
                onValueChange={(value) => {
                  setSound(value);
                }}
              >
                <SelectTrigger
                  className="w-[148px]"
                  data-cy={'role-selector-trigger'}
                >
                  <SelectValue />
                  {sound === '' && (
                    <SelectIcon>
                      <div className="flex items-center">
                        <p className="font-sm font-normal">Time&apos;s up!</p>
                      </div>
                    </SelectIcon>
                  )}
                </SelectTrigger>

                <SelectContent>
                  {soundOptions.map((sound: Sound) => (
                    <SelectItem
                      key={sound.name}
                      data-cy={`cartoon`}
                      value={sound.sound}
                    >
                      <div className="flex space-x-2">
                        <Image alt="music" src={sound.icon} />
                        <span className={'text-sm'}>{sound.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                onClick={() => {
                  setDisplayMinute(formatNumber(displayMinute as any));
                  setDisplaySecond(formatNumber(displaySecond as any));
                  setPlay(true);
                  setPause(false);

                  onSetTimer(true, false, true);
                }}
                className="h-9 w-14 bg-green-200 hover:bg-green-100 rounded-md p-2 flex items-center justify-center"
              >
                <Image
                  className="h-full w-full object-contain"
                  src={play}
                  alt="play"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}

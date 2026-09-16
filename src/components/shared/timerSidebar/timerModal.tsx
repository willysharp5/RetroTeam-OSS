import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import timer from 'public/assets/svg/timer-orange.svg';
import pauseIcon from 'public/assets/svg/pause.svg';
import playIcon from 'public/assets/svg/play.svg';
import x from 'public/assets/svg/x_white.svg';
import useFetchTimer from '~/lib/server/board/get-timer';
import { useSetTimer } from '~/lib/board/hooks/use-set-timer';
import { MembershipRole } from '~/lib/organizations/types/membership-role';
import If from '~/core/ui/If';
import { useGetOrganizationById } from '~/lib/organizations/hooks/use-get-organization-by-id';
import { usePatchOrganization } from '~/lib/organizations/hooks/use-patch-organization';

interface TimerModalProps {
  organizationId: string;
  retrospectiveId: string;
  setMinute: (minute: any) => void;
  minute: any;
  second: any;
  setSecond: (second: any) => void;
  sound: any;
  play: boolean;
  setPlay: (play: boolean) => void;
  pause: boolean;
  setPause: (pause: boolean) => void;
  currentUserRole: number;
}

export default function TimerModal({
  organizationId,
  retrospectiveId,
  minute,
  setMinute,
  second,
  setSecond,
  sound,
  play,
  setPlay,
  pause,
  setPause,
  currentUserRole,
}: TimerModalProps) {
  
  const isFacilitator = currentUserRole === MembershipRole.Facilitator;

  const {
    data: timerData,
  } = useFetchTimer(organizationId, retrospectiveId);

  const audioRef = useRef<HTMLAudioElement>(null);

  const { organization: organizationData } =
    useGetOrganizationById(organizationId);

  // TIMER FUNCTIONS
  const updateTimer = useSetTimer();
  const { patchOrganization } = usePatchOrganization(organizationId);

  // Update the timer in Firestore when minute, second, play, or pause changes
  const onSetTimer = useCallback(
    async (
      minute: any,
      second: any,
      play: boolean,
      pause: boolean,
      show: boolean,
    ) => {
      try {
        if (retrospectiveId) {
          await updateTimer(
            organizationId,
            retrospectiveId,
            minute,
            second,
            play,
            pause,
            show,
            sound,
          );
        } else {
          patchOrganization({
            minute,
            second,
            play,
            pause,
            showTimerModal: show,
            sound,
          });
        }
      } catch (e) {
        console.error('Error updating timer', e);
      }
    },
    [organizationId, retrospectiveId, sound, updateTimer, patchOrganization],
  );

  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (retrospectiveId) {
      if (timerData) {
        setPause(timerData.pause);
        setPlay(timerData.play);
        setSecond(timerData.second);
        setMinute(timerData.minute);
      }
    } else {
      if (organizationData) {
        if (organizationData?.hasOwnProperty('minute')) {
          setPause(organizationData.pause);
          setPlay(organizationData.play);
          setSecond(organizationData.second);
          setMinute(organizationData.minute);
        }
      }
    }
  }, [timerData, organizationData]);

  // If timer is playing
  useEffect(() => {
    if (!pause) {
      const intervalId = setInterval(() => {
        if (retrospectiveId && timerData && timerData?.showTimerModal) {
          if (second > 0) {
            onSetTimer(
              minute,
              second - 1,
              play,
              pause,
              timerData.showTimerModal,
            );
          } else if (minute > 0) {
            onSetTimer(minute - 1, 59, play, pause, timerData.showTimerModal);
          } else {
            clearInterval(intervalId);
            if (audioRef.current && sound !== 'none') {
              const audio = audioRef.current;
              audio.src = sound || '/assets/sounds/bell.mp3';
              audio.play();
              setIsPlaying(true);
            }
          }
        } else if (organizationData && organizationData?.showTimerModal) {
          if (second > 0) {
            onSetTimer(
              minute,
              second - 1,
              play,
              pause,
              organizationData.showTimerModal,
            );
          } else if (minute > 0) {
            onSetTimer(
              minute - 1,
              59,
              play,
              pause,
              organizationData.showTimerModal,
            );
          } else {
            clearInterval(intervalId);
            if (audioRef.current && sound !== 'none') {
              const audio = audioRef.current;
              audio.src = sound || '/assets/sounds/bell.mp3';
              audio.play();
              setIsPlaying(true);
            }
          }
        }
      }, 1000);

      return () => clearInterval(intervalId);
    } else if (pause && audioRef.current) {
      audioRef.current.pause();
    }
  }, [
    minute,
    second,
    play,
    pause,
    timerData?.showTimerModal,
    organizationData?.showTimerModal,
  ]);

  // If modal is hidden
  useEffect(() => {
    if (!timerData?.showTimerModal) {
      onSetTimer(5, 0, false, true, false);

      if (audioRef.current) {
        const currentAudio = audioRef.current as HTMLAudioElement;
        currentAudio.pause();
      }
    }
  }, [timerData]);

  useEffect(() => {
    if (minute > 0 || second > 0) setIsPlaying(false);
  }, [minute, second]);

  const isHideModal = () => {
    if (retrospectiveId) {
      return !timerData?.showTimerModal;
    }
    return !organizationData?.showTimerModal;
  };

  return (
    <div
      className={`fixed items-center justify-center bottom-8 left-1/2 transform -translate-x-1/2 ${
        isHideModal() ? 'hidden' : ''
      }`}
    >
      <audio ref={audioRef} src={timerData?.sound}></audio>
      <div className="flex relative items-center justify-center border border-2 border-black bg-white rounded-md px-[11px] py-2.5 space-x-[3.5px]">
        <div className="w-[158px] justify-center flex space-x-2 items-center text-3xl font-medium py-2 px-4 border rounded-md">
          <Image src={timer} alt="timer" className="h-4 w-4" />
          <p>{minute < 10 ? `0${minute}` : minute}</p>
          <p>:</p>
          <p>{second < 10 ? `0${second}` : second}</p>
        </div>
        {isFacilitator ? (
          <button
            disabled={
              retrospectiveId
                ? timerData?.pause && isPlaying
                : organizationData?.pause && isPlaying
            }
            onClick={() => {
              if (retrospectiveId) {
                onSetTimer(
                  timerData.minute,
                  timerData.second,
                  timerData.play,
                  !timerData.pause,
                  timerData.showTimerModal,
                );
              } else {
                onSetTimer(
                  organizationData?.minute,
                  organizationData?.second,
                  organizationData?.play,
                  !organizationData?.pause,
                  organizationData?.showTimerModal,
                );
              }
            }}
            className="hover:bg-orange-400 bg-orange-500 disabled:bg-gray-100 h-10 w-10 rounded-full flex items-center justify-center"
          >
            <Image
              src={
                retrospectiveId
                  ? timerData?.pause
                    ? playIcon
                    : pauseIcon
                  : organizationData?.pause
                  ? playIcon
                  : pauseIcon
              }
              alt="pause"
              className="h-4 w-4"
            />
          </button>
        ) : (
          <div className="bg-gray-500 h-10 w-10 rounded-full flex items-center justify-center">
            <Image
              src={
                retrospectiveId
                  ? !timerData?.pause
                    ? pauseIcon
                    : playIcon
                  : !organizationData?.pause
                  ? pauseIcon
                  : playIcon
              }
              alt="pause"
              className="h-4 w-4"
            />
          </div>
        )}
      </div>
      <If condition={isFacilitator}>
        <button
          onClick={() => {
            onSetTimer(5, 0, false, true, false);

            if (audioRef.current) {
              const currentAudio = audioRef.current as HTMLAudioElement;
              currentAudio.pause();
            }
          }}
          className="absolute top-[-18px] right-[-12px] mb-32 bg-black rounded-full flex items-center justify-center w-8 h-8"
        >
          <Image src={x} alt="x" className="h-4 w-4" />
        </button>
      </If>
    </div>
  );
}

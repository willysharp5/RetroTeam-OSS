import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import timer from 'public/assets/svg/timer-orange.svg';
import pauseIcon from 'public/assets/svg/pause.svg';
import playIcon from 'public/assets/svg/play.svg';
import x from 'public/assets/svg/x_white.svg';

interface TimerModalProps {
  setMinute: (minute: any) => void;
  minute: any;
  second: any;
  setSecond: (second: any) => void;
  sound: any;
  play: boolean;
  setPlay: (play: boolean) => void;
  pause: boolean;
  setPause: (pause: boolean) => void;
  showPlayModal: boolean;
  setShowPlayModal: (play: boolean) => void;
}

export default function TimerModalDemo({
  minute,
  setMinute,
  second,
  setSecond,
  sound,
  play,
  setPlay,
  pause,
  setPause,
  showPlayModal,
  setShowPlayModal,
}: TimerModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // If timer is playing
  useEffect(() => {
    if (!pause) {
      const intervalId = setInterval(() => {
        if (second > 0) {
          setMinute(minute);
          setSecond(second - 1);
        } else if (minute > 0) {
          setMinute(minute - 1);
          setSecond(59);
        } else {
          clearInterval(intervalId);
          if (audioRef.current && sound !== 'none' && showPlayModal) {
            const audio = audioRef.current;
            audio.src = sound || '/assets/sounds/bell.mp3';
            audio.play();
            setIsPlaying(true);
          }
        }
      }, 1000);

      return () => clearInterval(intervalId);
    } else if (pause && audioRef.current) {
      audioRef.current.pause();
    }
  }, [minute, second, play, pause]);

  useEffect(() => {
    if (minute > 0 || second > 0) setIsPlaying(false);
  }, [minute, second]);

  return (
    <div
      className={`fixed items-center justify-center bottom-8 left-1/2 transform -translate-x-1/2 ${
        !showPlayModal ? 'hidden' : ''
      }`}
    >
      <audio ref={audioRef} src={sound}></audio>
      <div className="flex relative items-center justify-center border border-2 border-black bg-white rounded-md px-[11px] py-2.5 space-x-[3.5px]">
        <div className="w-[158px] justify-center flex space-x-2 items-center text-3xl font-medium py-2 px-4 border rounded-md">
          <Image src={timer} alt="timer" className="h-4 w-4" />
          <p>{minute < 10 ? `0${minute}` : minute}</p>
          <p>:</p>
          <p>{second < 10 ? `0${second}` : second}</p>
        </div>

        <button
          disabled={isPlaying}
          onClick={() => {
            setPause(!pause);
            setPlay(!isPlaying);
          }}
          className="hover:bg-orange-400 bg-orange-500 disabled:bg-gray-100 h-10 w-10 rounded-full flex items-center justify-center"
        >
          <Image
            src={pause ? playIcon : pauseIcon}
            alt="pause"
            className="h-4 w-4"
          />
        </button>
      </div>
      <button
        onClick={() => {
          setPause(true);
          setShowPlayModal(false);
          if (audioRef.current) {
            const currentAudio = audioRef.current as HTMLAudioElement;
            currentAudio.currentTime = 0;
            currentAudio.pause();
          }
        }}
        className="absolute top-[-18px] right-[-12px] mb-32 bg-black rounded-full flex items-center justify-center w-8 h-8"
      >
        <Image src={x} alt="x" className="h-4 w-4" />
      </button>
    </div>
  );
}

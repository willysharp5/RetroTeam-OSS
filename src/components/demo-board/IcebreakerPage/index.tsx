import { useCallback, useEffect, useState } from 'react';


import { useRouter } from 'next/router';
import Image from 'next/image';

import { useIcebreakers } from '~/lib/icebreakers/hooks/use-icebreakers';

import questionMark from 'public/assets/svg/question-mark-circled.svg';

import Cookies from 'js-cookie';

import { SelectionBar } from '~/components/shared/SelectionBar';

import DemoIcebreakerHeader from '~/components/layouts/sidebar/DemoIcebreakerHeader';
import TimerModalDemo from '~/components/shared/timerSidebar/timerModalDemo';

export default function IcebreakerDemo() {
  const [icebreaker, setIcebreaker] = useState<string | null>(null);

  const router = useRouter();

  const [showMembersSidebar, setShowMembersSidebar] = useState(false);

  const { getRandomIcebreaker, categories } = useIcebreakers();

  const [category, setCategory] = useState<string>('');
  const [categoryColor, setCategoryColor] = useState('');

  const changeCategory = (newCategory: string) => {
    const icebreaker = getRandomIcebreaker(newCategory);
    setIcebreaker(icebreaker);
    setCategory(newCategory);
  };

  // TIMER FUNCTIONS

  const [sound, setSound] = useState('');

  useEffect(() => {
    if (categories.length > 0) {
      const defaultCategory = categories[0] as any;
      setCategory(defaultCategory?.category)
      setCategoryColor(defaultCategory?.color);
      const icebreaker = getRandomIcebreaker(defaultCategory?.category)
      setIcebreaker(icebreaker);
    }
  }, [categories]);

  const [minute, setMinute] = useState(5);
  const [second, setSecond] = useState(0);

  const [play, setPlay] = useState(false);
  const [pause, setPause] = useState(false);

  const [showPlayModal, setShowPlayModal] = useState(false);
  const [showTimerSidebar, setShowTimerSidebar] = useState(false);
  const start = Cookies.get('startBoard');

  return (
    <div>
      {(showMembersSidebar || showTimerSidebar) && (
        <div className="fixed top-0 left-0 w-full h-full bg-black opacity-20 z-10 pointer-events-auto "></div>
      )}
      <DemoIcebreakerHeader
        setShowPlayModal={setShowPlayModal}
        minute={minute}
        setMinute={setMinute}
        second={second}
        setSecond={setSecond}
        sound={sound}
        setSound={setSound}
        setPlay={setPlay}
        setPause={setPause}
        showMembersSidebar={showMembersSidebar}
        setShowMembersSidebar={setShowMembersSidebar}
        showTimerSidebar={showTimerSidebar}
        setShowTimerSidebar={setShowTimerSidebar}
      />
      <div
        id="screen"
        style={{
          width: '-webkit-fill-available',
          height: '-webkit-fill-available',
        }}
        className={`flex-1 absolute space-y-4 md:space-y-16 pt-6 px-8 py-6 tv:px-36 flex flex-col flex-1 overflow-auto bg-${categoryColor}`}
      >
        <div className="md:flex justify-between items-center py-5 space-y-6 md:space-y-0">
          <h1 className="text-3xl font-semibold">Ice Breaker</h1>
          <button
            className={`flex justify-center ${
              start === 'true'
                ? 'bg-orange-500 hover:bg-orange-400  text-white'
                : 'bg-white hover:bg-gray-100 text-black'
            } py-2 px-4 rounded-md cursor-pointer`}
            onClick={() => router.push('/demo')}
          >
            <span> Back to retrospective</span>
          </button>
        </div>
        <div>
          <SelectionBar
            options={categories}
            selected={category}
            setSelected={changeCategory}
          />
        </div>
        <div className="flex justify-center">
          <div className="bg-white flex flex-col justify-center items-center border rounded-md border-zinc-100 shadow min-w-[85%] min-h-[24rem] px-12">
            <div className="text-2xl font-bold pb-12 text-center">
              {icebreaker}
            </div>
            <button
              className="flex w-full max-w-[28rem] justify-center items-center bg-red-500 hover:bg-red-400 text-white text-sm py-2 px-4 rounded-md"
              onClick={() => {
                changeCategory(category);
              }}
            >
              <Image className="mr-2 w-auto" src={questionMark} alt="" />
              Generate New Question
            </button>
          </div>
        </div>
      </div>
      <TimerModalDemo
        minute={minute}
        setMinute={setMinute}
        second={second}
        setSecond={setSecond}
        sound={sound}
        play={play}
        setPlay={setPlay}
        pause={pause}
        setPause={setPause}
        setShowPlayModal={setShowPlayModal}
        showPlayModal={showPlayModal}
      />
    </div>
  );
}

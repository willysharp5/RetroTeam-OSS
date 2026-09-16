import Image from 'next/image';

import brainWhite from '/public/assets/svg/brain-white.svg';

const RegenerateAiButton = ({ onAction, disabled = false }: any) => {
  return (
    <div className="flex space-x-2">
      <button
        disabled={disabled}
        onClick={onAction}
        className="flex space-x-2 items-center py-2 px-4 rounded-md bg-purple-600 hover:bg-purple-500 disabled:bg-purple-300 text-white text-sm"
      >
        <Image className="" src={brainWhite} alt="brainWhite" />
        <p>Regenerate</p>
      </button>
    </div>
  );
};

export default RegenerateAiButton;

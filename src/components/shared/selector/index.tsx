import { Access } from '~/lib/access/types/access';
import Image, { StaticImageData } from 'next/image';

interface Option {
  title: string;
  description: string;
  icon: StaticImageData;
}
interface Props {
  options: Option[];
  selectedOption: Access | null;
  setOption: React.Dispatch<React.SetStateAction<Access>>;
}

export default function Selector({
  options,
  selectedOption,
  setOption,
}: Props) {
  const handleOptionClick = (title: string) => {
    if (title === 'public' || title === 'private' || title === 'team') {
      setOption({ type: title });
    } else {
      console.error('The name of the access type is not valid: ', title);
    }
  };

  return (
    <div>
      <ul className="space-y-2">
        {options.map((option, index) => (
          <li
            key={index}
            onClick={() => handleOptionClick(option.title)}
            className={`flex items-start cursor-pointer ${
              selectedOption?.type === option.title
                ? 'bg-zinc-100 text-black'
                : 'bg-white text-black'
            } p-2 rounded-md transition-colors`}
          >
            <div className="mr-4">
              <Image src={option.icon} alt={option.title} className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-zinc-900">{option.title}</h3>
              <p className="text-sm text-zinc-500">{option.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

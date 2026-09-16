interface Props {
  options: any[];
  selected: string;
  setSelected: (category: string) => void;
}

export function SelectionBar({
  options,
  selected,
  setSelected,
}: Props) {
  return (
    <div className="md:flex justify-center">
      <div
        className={`md:flex bg-zinc-100 text-zinc-500 font-medium rounded-lg border-4 border-zinc-100 cursor-pointer`}
      >
        {options.map((option, index) => (
          <div
            key={`option ${index}`}
            className={`py-1 px-3 rounded-sm capitalize ${
              selected === option.category ? `bg-white` : ''
            }`}
            onClick={() => {
              setSelected(option.category);
            }}
          >
            {option.category.split('_').join(' ')}
          </div>
        ))}
      </div>
    </div>
  );
}

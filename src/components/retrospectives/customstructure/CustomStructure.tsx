import Image from 'next/image';
import { useState, ChangeEvent, useEffect } from 'react';

import { Structure } from '~/lib/structures/types/structures';

import trash from 'public/assets/svg/trash.svg';
import plusCircled from 'public/assets/svg/plus-circled-black.svg';

interface CustomStructureProps {
  customStructure: Structure[];
  setCustomStructure: React.Dispatch<React.SetStateAction<Structure[]>>;
  customTitle: string;
  setCustomTitle: React.Dispatch<React.SetStateAction<string>>;
}

const baseStructure: Structure = {
  name: '',
  description: '',
};

export default function CustomStructure({
  customStructure,
  setCustomStructure,
  customTitle,
  setCustomTitle,
}: CustomStructureProps) {
  const [emptyNameIndices, setEmptyNameIndices] = useState<number[]>([]);

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCustomTitle(event.target.value);
  };
  
  const handleStructureChange = (
    index: number,
    field: keyof Structure,
    value: string,
  ) => {
    const newItems: any = [...customStructure];
    newItems[index][field] = value;

    // Check for empty names and update errors state
    if (field === 'name' && value.trim() !== '') {
      setEmptyNameIndices((prevIndices) =>
        prevIndices.filter((i) => i !== index),
      );
    }

    setCustomStructure(newItems);
  };

  const handleAddItem = () => {
    // Check if all existing items are filled
    const allItemsFilled = customStructure.every(
      (item) => item.name.trim() !== '',
    );

    const emptyIndices = customStructure.reduce<number[]>(
      (accumulator, element, index) => {
        if (element.name.trim() === '') accumulator.push(index);
        return accumulator;
      },
      [],
    );

    setEmptyNameIndices(emptyIndices);
    if (allItemsFilled && customStructure.length < 5) {
      setCustomStructure([...customStructure, { name: '', description: '' }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (customStructure.length > 1) {
      const newItems = customStructure.filter((item, i) => i !== index);
      setCustomStructure(newItems);
    } else {
      setCustomStructure([{ ...baseStructure }]);
    }
  };

  const resetTemplate = () => {
    setCustomStructure([{ ...baseStructure }]);
    setCustomTitle('');
  };

  useEffect(() => {
    return () => {
      const hasValues = customStructure.every(
        (item) => item.name.trim() !== '',
      );
      if (!hasValues) resetTemplate();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h5 className="font-semibold text-lg mb-4">Structure</h5>
        <Image
          className={`w-6 h-6 flex items-start ${
            customStructure.length === 5
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer'
          }`}
          src={plusCircled}
          alt=""
          onClick={handleAddItem}
        />
      </div>
      <div className="space-y-2 shadow-sm  mt-4 bg-gray-100 p-3 mb-6">
        <p className="text-base text-black font-semibold">Template Name</p>
        <input
          type="text"
          className={`border rounded-md py-1 px-3 text-sm w-full`}
          placeholder="Retrospective name"
          value={customTitle}
          onChange={handleTitleChange}
        />
      </div>
      <div className="bg-[#E4E4E7] my-4 h-px w-full"></div>
      <div className="space-y-6 shadow-sm  mt-4 bg-gray-100 p-3 mb-6">
        <p className="text-base text-black font-semibold">Template Sections</p>

        {customStructure.map((item, index) => (
          <div className="flex items-center" key={`custom structure ${index}`}>
            <div className="space-y-2 w-11/12">
              <input
                type="text"
                className={`border rounded-md py-1 px-3 text-sm w-full ${
                  emptyNameIndices.includes(index) ? 'border-red-500' : ''
                }`}
                value={item.name}
                placeholder="Name"
                onChange={(e) =>
                  handleStructureChange(index, 'name', e.target.value)
                }
              />
              <input
                type="text"
                className="border rounded-md py-1 px-3 text-sm w-full"
                value={item.description}
                placeholder="Description (optional)"
                onChange={(e) =>
                  handleStructureChange(index, 'description', e.target.value)
                }
              />
            </div>
            <div className="w-1/12">
              <Image
                className={`w-full cursor-pointer ${
                  customStructure.length === 1 &&
                  customStructure[0].name === '' &&
                  customStructure[0].description === ''
                    ? 'opacity-50'
                    : ''
                }`}
                src={trash}
                alt=""
                onClick={() => handleRemoveItem(index)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

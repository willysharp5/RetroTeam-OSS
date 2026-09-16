import CustomStructure from '../customstructure/CustomStructure';

import { Structure } from '~/lib/structures/types/structures';

interface Props {
  structure: Structure[];
  setStructure: React.Dispatch<React.SetStateAction<Structure[]>>;
  templateTitle: string;
  setTemplateTitle: React.Dispatch<React.SetStateAction<string>>;
  handleCreateTemplate: () => void;
}
export const AddCustomTemplate = ({
  structure,
  setStructure,
  templateTitle,
  setTemplateTitle,
  handleCreateTemplate,
}: Props) => {
  function isValidTemplate() {
    return (
      templateTitle.trim() !== '' &&
      structure.every((entry) => entry.name.trim() !== '')
    );
  }

  return (
    <div className="flex flex-col justify-between space-y-6 pt-16 px-6 min-h-[95%]">
      <CustomStructure
        customStructure={structure}
        setCustomStructure={setStructure}
        customTitle={templateTitle}
        setCustomTitle={setTemplateTitle}
      />
      <button
        onClick={handleCreateTemplate}
        className="flex w-full justify-center mt-6 bg-orange-500 hover:bg-orange-400 disabled:bg-orange-300 text-white py-2 px-4 rounded-md"
        disabled={!isValidTemplate()}
      >
        <span> Save Template</span>
      </button>
    </div>
  );
};

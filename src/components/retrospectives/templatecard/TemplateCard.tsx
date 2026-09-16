import { MouseEvent, useEffect, useState } from 'react';
import Image from 'next/image';

import ContextMenu from '~/components/shared/contextMenu';
import DeleteModal from '~/components/shared/deleteModal';
import RightPanel from '~/components/shared/RightPanel';
import CustomStructure from '../customstructure/CustomStructure';

import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';
import { useCurrentTeam } from '~/lib/organizations/hooks/use-current-team';
import { useEditCustomTemplate } from '~/lib/templates/hooks/use-edit-custom-template';
import { useDeleteCustomTemplate } from '~/lib/templates/hooks/use-delete-custom-template';

import { Templates } from '~/lib/templates/types/templates';
import { Structure } from '~/lib/structures/types/structures';

import plus from '/public/assets/svg/plus-orange.svg';
import edit from 'public/assets/svg/edit-3.svg';
import trash from 'public/assets/svg/trash.svg';

interface TemplateCardProps {
  name: string;
  summary?: string;
  templateId?: string;
  template?: Templates;
  refetch?: (page: number) => void;
}

export default function TemplateCard({
  name,
  summary,
  templateId,
  template,
  refetch,
}: TemplateCardProps) {
  
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showEditPanel, setShowEditPanel] = useState<boolean>(false);
  const [structure, setStructure] = useState<Structure[]>([]);
  const [title, setTitle] = useState<string>(template?.title || '');

  const organization = useCurrentOrganization();
  const organizationID = organization?.id as string;
  const { team } = useCurrentTeam();
  const teamId = team?.id as string;

  const { deleteTemplate } = useDeleteCustomTemplate(organizationID, teamId);
  const { editTemplate } = useEditCustomTemplate(organizationID, teamId);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const onDeleteTemplate = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setShowDeleteModal(true);
  };

  const onEditTemplate = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setShowEditPanel(true);
  };

  const confirmDeleteTemplate = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (templateId && refetch) {
      deleteTemplate(templateId);
      setShowDeleteModal(false);
      refetch(1);
    }
  };

  const saveEditedTemplate = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (templateId && refetch) {
      editTemplate(templateId, { title, structure });
      setShowEditPanel(false);
      refetch(1);
    }
  };

  function isValidTemplate() {
    return (
      title.trim() !== '' &&
      structure.every((entry) => entry.name.trim() !== '')
    );
  }

  useEffect(() => {
    if (template) setStructure(template?.structure);
  }, [template]);

  const menuOptions = [
    {
      name: 'Edit',
      action: onEditTemplate,
      icon: edit,
    },
    {
      name: 'Delete',
      action: onDeleteTemplate,
      icon: trash,
    },
  ];

  return (
    <div
      className={
        'group flex justify-center items-center rounded-lg p-6 h-40 bg-white border border-zinc-200 text-zinc-900 relative hover:bg-orange-500 hover:text-white transition cursor-pointer'
      }
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isHovered ? (
        <p className="text-sm text-center">{summary ? summary : name}</p>
      ) : (
        <div className="flex justify-center items-center max-w-[230px]">
          <Image className="mr-2 w-5" src={plus} alt="plus" />{' '}
          <p className="inline-block text-sm w-auto text-center mt-1">{name}</p>
        </div>
      )}
      {templateId && (
        <ContextMenu
          options={menuOptions}
          mainClassName="top-4 right-4 px-3 py-1 flex justify-center z-0 absolute"
        />
      )}
      <div onClick={(e) => e.stopPropagation()}>
        <DeleteModal
          title="Delete template?"
          message="Are you sure you want to delete this template?"
          confirmMessage="Delete"
          cancelMessage="Cancel"
          showModal={showDeleteModal}
          setShowModal={setShowDeleteModal}
          confirmAction={confirmDeleteTemplate}
          cancelAction={(event) => {
            event.stopPropagation();
            setShowDeleteModal(false);
          }}
        />
      </div>

      {showEditPanel && template && (
        <RightPanel setShowPanel={setShowEditPanel} panelTitle="Edit template">
          <div className="min-h-[95%] flex flex-col justify-between">
            <div>
              <div className="h-16" />
              <CustomStructure
                customStructure={structure}
                setCustomStructure={setStructure}
                customTitle={title}
                setCustomTitle={setTitle}
              />
            </div>
            <button
              onClick={saveEditedTemplate}
              className="flex w-full justify-center mt-6 bg-orange-500 hover:bg-orange-400 disabled:bg-orange-300 text-white py-2 px-4 rounded-md"
              disabled={!isValidTemplate()}
            >
              <span> Save Template</span>
            </button>
          </div>
        </RightPanel>
      )}
    </div>
  );
}

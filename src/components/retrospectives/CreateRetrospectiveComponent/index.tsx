import { useState, useEffect } from 'react';

import TemplateCard from '../templatecard/TemplateCard';
import RightPanel from '~/components/shared/RightPanel';
import SectionHeader from '~/components/shared/sectionheader';
import { AddRetrospective } from '../AddRetrospective';
import { AddCustomTemplate } from '../AddCustomTemplate';

import { useRouter } from 'next/router';
import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';
import { useCurrentTeam } from '~/lib/organizations/hooks/use-current-team';
import { useAddRetrospective } from '~/lib/retrospectives/hooks/use-add-retrospectives';
import { useAddCustomTemplate } from '~/lib/templates/hooks/use-add-custom-template';
import { useGetCustomTemplates } from '~/lib/templates/hooks/use-get-custom-templates';
import { useAuth } from 'reactfire';

import { Structure } from '~/lib/structures/types/structures';
import { Access } from '~/lib/access/types/access';

import { showDateWithSuffix } from '~/components/utils/dateformatter';

import { Templates } from '~/lib/templates/types/templates';
import Cookies from 'js-cookie';

import PaginationController from '~/components/shared/paginationController';
import toast from 'react-hot-toast';

const DEFAULT_ROWS = 1;

const baseStructure: Structure[] = [
  {
    name: '',
    description: '',
  },
];

interface Props {
  onCreateRetrospective?: () => void;
}

export const CreateRetrospectiveComponent = ({
  onCreateRetrospective,
}: Props) => {
  const organization = useCurrentOrganization();
  const organizationID = organization?.id as string;

  const { team } = useCurrentTeam();
  const teamId = team?.id as string;

  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS);

  const {
    data: customTemplates,
    refetch,
    totalPages,
    currentPage,
  } = useGetCustomTemplates(
    organizationID,
    teamId,
    rowsPerPage === 1 ? rowsPerPage + 1 : rowsPerPage + 3,
  );

  const router = useRouter();

  const auth = useAuth();
  const userId = auth.currentUser?.uid || '';

  const addCustomTemplate = useAddCustomTemplate();
  const addRetrospective = useAddRetrospective();

  const [showAddRetrospective, setShowAddRetrospective] = useState(false);

  // Create retrospective states
  const [templateTitle, setTemplateTitle] = useState('');
  const [boardTitle, setBoardTitle] = useState(
    `Retrospective ${showDateWithSuffix(new Date())}`,
  );
  const [structure, setStructure] = useState<Structure[]>(baseStructure);
  const [access, setAccess] = useState<Access>({
    type: 'public',
  });
  const [useIcebreaker, setUseIcebreaker] = useState(true);
  const [useCustomStructure, setUseCustomStructure] = useState(false);

  async function handleCreateRetrospective() {
    if (boardTitle !== '') {
      const retrospective = {
        title: templateTitle,
        name: boardTitle,
        structure: structure,
        access: access,
        icebreaker: useIcebreaker,
        date: new Date(),
        organization: organizationID,
        createdBy: userId,
        allowMembersViewComments: false,
      };

      let retrospectiveId: string | undefined;

      try {
        retrospectiveId = await addRetrospective(
          retrospective,
          userId,
          organizationID,
          teamId,
        );
      } catch (e) {
        toast.error(
          e instanceof Error
            ? e.message
            : 'Could not create the retrospective. Check the browser console for details.',
        );

        return;
      }
      setShowAddRetrospective(false);
      if (onCreateRetrospective) onCreateRetrospective();
      // Pending to add the follow up to start a retrospective
      if (retrospectiveId && retrospective.icebreaker) {
        Cookies.set('startBoard', 'true');
        router.push(`/icebreaker?id=${retrospectiveId}`);
      } else if (retrospectiveId) {
        router.push(`/board/${retrospectiveId}`);
      }
    } else {
      toast.error('Board must have a name');
    }
  }

  function handleCreateTemplate() {
    addCustomTemplate(
      { title: templateTitle, structure },
      organizationID,
      teamId,
    );
    fetchCustomTemplates(1);
    setShowAddRetrospective(false);
  }

  const fetchCustomTemplates = async (page: number) => {
    try {
      refetch(page);
    } catch (error) {
      console.error('Error getting the custom templates', error);
    }
  };

  useEffect(() => {
    if (!showAddRetrospective) {
      setUseCustomStructure(false);
      setStructure(baseStructure);
      setTemplateTitle('');
    }
  }, [showAddRetrospective]);

  useEffect(() => {
    fetchCustomTemplates(1);
  }, []);
  return (
    <>
      <div className={'flex flex-col space-y-6 '}>
        <div className="bg-gray-100 space-y-6 px-9 py-7 tv:px-36">
          <SectionHeader description="Build your own retrospectives template to fit your team's need.">
            Custom
          </SectionHeader>
          <div className={'grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-2.5'}>
            <div
              onClick={() => {
                setTemplateTitle('Custom');
                setStructure(baseStructure);
                setUseCustomStructure(true);
                setShowAddRetrospective(!showAddRetrospective);
              }}
            >
              <TemplateCard name={'Custom'} summary={'Custom'} />
            </div>
            {customTemplates?.map((template: Templates) => {
              return (
                <div
                  key={template.id}
                  onClick={() => {
                    setTemplateTitle(template.title);
                    setStructure(template.structure);
                    setShowAddRetrospective(!showAddRetrospective);
                  }}
                >
                  <TemplateCard
                    name={template.title}
                    summary={template.summary}
                    templateId={template.id}
                    template={template}
                    refetch={refetch}
                  />
                </div>
              );
            })}
          </div>
          <PaginationController
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            totalPages={totalPages}
            currentPage={currentPage}
            refetch={refetch}
          />
        </div>
      </div>
      {showAddRetrospective && (
        <RightPanel
          setShowPanel={setShowAddRetrospective}
          panelTitle={templateTitle}
        >
          <>
            {useCustomStructure ? (
              <AddCustomTemplate
                structure={structure}
                setStructure={setStructure}
                templateTitle={templateTitle}
                setTemplateTitle={setTemplateTitle}
                handleCreateTemplate={handleCreateTemplate}
              />
            ) : (
              <AddRetrospective
                boardTitle={boardTitle}
                setBoardTitle={setBoardTitle}
                structure={structure}
                useIcebreaker={useIcebreaker}
                setUseIcebreaker={setUseIcebreaker}
                access={access}
                setAccess={setAccess}
                handleCreateRetrospective={handleCreateRetrospective}
              />
            )}
          </>
        </RightPanel>
      )}
    </>
  );
};

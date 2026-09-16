import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import toaster from 'react-hot-toast';

import Image from 'next/image';
import { useRouter } from 'next/router';

import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '~/core/ui/Select';

import x from 'public/assets/svg/x.svg';
import send from '/public/assets/svg/send.svg';

import Modal from '~/components/shared/modal';

import SearchableDropdown from '../searchableDropdown/searchableDropdown';

import useFetchJiraProjects from '~/lib/server/jira/useFetchJiraProjects';
import useAddJiraTicket from '~/lib/server/jira/useAddJiraTicket';
import useFetchJiraIssues from '~/lib/server/jira/useFetchJiraIssues';
import useFetchJiraEpics from '~/lib/server/jira/useFetchJiraEpics';
import useUpdateJiraAction from '~/lib/server/jira/useUpdateJiraAction';
import configuration from '~/configuration';

interface AddToJiraModalProps {
  setAddJiraModal: (show: boolean) => void;
  organizationData: any;
  description: string;
  actionId: String;
  teamId: string;
  userData: any;
  retrospectiveId?: string;
}
export function AddToJiraModal({
  setAddJiraModal,
  organizationData,
  description,
  actionId,
  teamId,
  userData,
  retrospectiveId,
}: AddToJiraModalProps) {
  const [jiraProjects, setJiraProjects] = useState([]);
  const [selectedJiraProject, setSelectedJiraProject] = useState<any>();

  const [jiraIssues, setJiraIssues] = useState([]);
  const [selectedIssueType, setSelectedIssueType] = useState('');

  const [epics, setEpics] = useState([]);
  const [filteredEpics, setFilteredEpics] = useState([]);
  const [selectedEpic, setSelectedEpic] = useState<any>();

  const [jiraEmail, setJiraEmail] = useState('');
  const [jiraApiToken, setJiraApiToken] = useState('');
  const [domain, setDomain] = useState('');

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingEpics, setLoadingEpics] = useState(false);

  const { trigger: getProjects } = useFetchJiraProjects();
  const { trigger: getEpic } = useFetchJiraEpics();
  const { trigger: getIssues } = useFetchJiraIssues();
  const { trigger: addJiraTicket } = useAddJiraTicket();

  const { trigger: updateAction } = useUpdateJiraAction(organizationData.id);

  const onGetJiraProjects = async (text: string) => {
    try {
      setLoadingProjects(true);
      const res = (await getProjects({
        text,
        email: jiraEmail,
        apiToken: jiraApiToken,
        domain: domain,
      })) as any;

      if (res.values) {
        setJiraProjects(res.values);
      }
    } catch (e) {
      console.error('ERROR onGetJiraProjects', e);
    } finally {
      setLoadingProjects(false);
    }
  };

  const onGetJiraEpics = async (projectKey: string) => {
    try {
      setLoadingEpics(true);
      const res = (await getEpic({
        domain: domain,
        email: jiraEmail,
        apiToken: jiraApiToken,
        projectId: projectKey,
      })) as any;

      if (res.issues) {
        const epicsWithLabel = res.issues.map((issue: any) => ({
          ...issue,
          name: issue.key + ' ' + issue.fields.summary,
          value: issue.id,
        }));

        setEpics(epicsWithLabel);
        setFilteredEpics(epicsWithLabel);
      }
    } catch (e) {
      console.error('ERROR onGetJiraProjects', e);
    } finally {
      setLoadingEpics(false);
    }
  };
  const searchEpics = async (text: string) => {
    try {
      if (epics) {
        const search = epics.filter((item: any) =>
          item.name.toLowerCase().includes(text.toLowerCase()),
        );

        setFilteredEpics(search);
      }
    } catch (e) {
      console.error('ERROR on Search Epics', e);
    }
  };

  const onGetJiraIssues = async (id: string) => {
    try {
      const res = (await getIssues({
        projectId: id,
        email: jiraEmail,
        apiToken: jiraApiToken,
        domain: domain,
      })) as any;

      if (res) {
        setJiraIssues(res);
      }
    } catch (e) {
      console.error('ERROR onGetJiraIssues', e);
    }
  };

  useEffect(() => {
    if (jiraEmail !== '' && jiraApiToken != '' && domain != '')
      onGetJiraProjects('');
  }, [jiraEmail, jiraApiToken, domain]);

  useEffect(() => {
    if (selectedJiraProject) {
      setFilteredEpics([]);
      setJiraIssues([]);
      setSelectedEpic('');
      setSelectedIssueType('');

      onGetJiraIssues(selectedJiraProject.id);
      onGetJiraEpics(selectedJiraProject.key);
    } else {
      setFilteredEpics([]);
      setJiraIssues([]);
      setSelectedEpic('');
      setSelectedIssueType('');
    }
  }, [selectedJiraProject]);

  useEffect(() => {
    if (organizationData) {
      setJiraEmail(organizationData.jiraIntegration.email);
      setJiraApiToken(atob(organizationData.jiraIntegration.apiKey));
      setDomain(atob(organizationData.jiraIntegration.domain));
    }
  }, [organizationData]);

  const updateActionJira = useCallback(
    async (key: string) => {
      const url = `${domain}/browse/${key}`;
      const body = {
        id: actionId,
        url,
        team: teamId,
        boardId: retrospectiveId,
      };
      const promise = updateAction(body).then((res: any) => {
        if (res.success) setAddJiraModal(false);
      });

      await toaster.promise(promise, {
        loading: `Connecting action to JIRA`,
        success: 'Action connected successfully',
        error: 'Error connecting action',
      });
    },
    [actionId, setAddJiraModal, teamId, updateAction, retrospectiveId, domain],
  );

  const sendTicketToJira = useCallback(async () => {
    try {
      if (!selectedJiraProject || selectedIssueType === '') {
        toast.error('Please select a Jira project and an issue type');
        return;
      }

      const userURL = retrospectiveId
        ? `${configuration.site.siteUrl}/board/${retrospectiveId}#actions`
        : `${configuration.site.siteUrl}/actions`;

      const body = {
        projectKey: selectedJiraProject.key,
        text: description,
        issueType: selectedIssueType,
        email: jiraEmail,
        apiToken: jiraApiToken,
        domain: domain,
        epic: selectedEpic.key,
        userName: userData?.fullName,
        userURL,
      };

      const promise = addJiraTicket(body);

      await toaster.promise(promise, {
        loading: `Creating ${selectedIssueType} on JIRA`,
        success: 'Ticket created successfully',
        error: (err: unknown) => {
          const e = err as { error?: { issuetype?: unknown; parentId?: unknown } };
          const message = e?.error?.issuetype
            ? 'An Epic cannot be a parent of another Epic'
            : e?.error?.parentId
            ? 'A subtask does not belong to an Epic'
            : 'Error creating ticket';

          return `${message}`;
        },
      });

      const res = (await promise) as any;
      if (res) {
        updateActionJira(res.key);
      }
    } catch (e) {
      console.error('ERROR sendTicketToJira:', e);
    }
  }, [
    selectedJiraProject,
    selectedIssueType,
    description,
    addJiraTicket,
    jiraApiToken,
    jiraEmail,
    domain,
    updateActionJira,
    selectedEpic,
    userData,
    retrospectiveId,
  ]);

  return (
    <Modal onClose={() => setAddJiraModal(false)}>
      <div
        style={{ opacity: 0.7 }}
        className="absolute top-0 left-0 w-full h-full bg-black z-50 opactiy-5"
      ></div>
      <div className="absolute z-100">
        <div className="flex items-center justify-center">
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50">
            <div className="bg-white w-[634px]  p-6 rounded-lg shadow-lg overflow-y-auto">
              <div className="flex justify-between">
                <div>
                  <p className="text-xl font-bold ">
                    <b>Jira settings</b>
                  </p>
                  <p className="text-sm text-gray-500">
                    Select your Jira Project and Issue Type.
                  </p>
                </div>

                <Image
                  className="h-7 w-7 cursor-pointer"
                  src={x}
                  alt="x"
                  onClick={() => setAddJiraModal(false)}
                ></Image>
              </div>
              <div className="space-y-6 py-10">
                <div>
                  <p>
                    <b>Jira Project</b>
                  </p>
                  <SearchableDropdown
                    refetch={onGetJiraProjects}
                    label="name"
                    placeholder={'Type Project Name'}
                    options={jiraProjects}
                    handleChange={setSelectedJiraProject}
                    selectedVal={selectedJiraProject}
                    loading={loadingProjects}
                  />
                </div>
                <div className="h-[3px] bg-[#E4E4E7] w-[90%] m-auto"></div>
                <div>
                  <p>
                    <b>Epic</b>
                  </p>
                  <SearchableDropdown
                    refetch={searchEpics}
                    label="name"
                    placeholder={'Type Epic Name'}
                    options={filteredEpics}
                    handleChange={setSelectedEpic}
                    selectedVal={selectedEpic}
                    loading={loadingEpics}
                  />
                </div>
                <div className="h-[3px] bg-[#E4E4E7] w-[90%] m-auto"></div>
                <div>
                  <p>
                    <b>Issue Type</b>
                  </p>
                  <Select
                    onValueChange={(value) => setSelectedIssueType(value)}
                  >
                    <SelectTrigger data-cy={'role-selector-trigger'}>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {jiraIssues.map((item: any) => (
                        <SelectItem
                          key={item.id}
                          data-cy={'issue-type'}
                          value={item.untranslatedName}
                        >
                          <p>{item.name}</p>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-6 flex justify-end w-full space-x-8">
                  <button
                    onClick={() => setAddJiraModal(false)}
                    className="py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendTicketToJira}
                    className="flex items-center gap-3 bg-orange-400 rounded-md py-2 px-4 text-white"
                  >
                    <Image src={send} alt="send" />
                    Send to Jira
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

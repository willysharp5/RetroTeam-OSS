import RetrospectiveCard from '../retrospectivecard/RetrospectiveCard';
import PaginationController from '~/components/shared/paginationController';

import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';
import { Rules } from '~/lib/rules/types';

interface RetrospectivesCardsProps {
  retrospectives: Retrospectives[];
  fetchRetrospectives: (value: number) => void;
  deleteRetrospective: (value: string) => void;
  patchRetrospective: (value: Partial<Retrospectives>) => void;
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  setRowsPerPage?: (value: number) => void;
  hidePaginationController?: boolean;
  rules: Rules;
  userId: string;
  isAnonymous: boolean;
  totalTeams: number;
}

export const RetrospectivesCards = ({
  retrospectives,
  fetchRetrospectives,
  currentPage,
  totalPages,
  rowsPerPage,
  setRowsPerPage,
  hidePaginationController,
  deleteRetrospective,
  patchRetrospective,
  rules,
  userId,
  isAnonymous,
  totalTeams
}: RetrospectivesCardsProps) => {
  return (
    <>
      {retrospectives.length > 0 ? (
        <div className="space-y-6">
          <div className={'grid grid-cols-1 md:grid-cols-2 gap-8'}>
            {retrospectives.map((retrospective) => {
              let isFacilitator = false;
              const currentUser = retrospective.members[userId as any];
              if (currentUser) {
                isFacilitator = currentUser.role > 0;
              } else {
                isFacilitator = false;
              }

              return (
                <RetrospectiveCard
                  key={retrospective.id}
                  open={!retrospective.finished}
                  title={retrospective.title}
                  name={retrospective.name}
                  date={retrospective.date.toDate()}
                  isPublic={retrospective.access.type === 'public'}
                  id={retrospective.id}
                  isArchived={retrospective.archived}
                  onDelete={deleteRetrospective}
                  onPatch={patchRetrospective}
                  rules={rules}
                  userId={userId}
                  isAnonymous={isAnonymous}
                  isFacilitator={isFacilitator}
                  totalTeams={totalTeams}
                />
              );
            })}
          </div>
          {!hidePaginationController && (
            <PaginationController
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage || (() => {})}
              totalPages={totalPages}
              currentPage={currentPage}
              refetch={fetchRetrospectives}
            />
          )}
        </div>
      ) : (
        <p className="py-16 text-center">No Boards</p>
      )}
    </>
  );
};

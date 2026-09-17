import { Tag } from '~/lib/board/types/types';

/**
 * @name DEFAULT_TAGS
 * @description The tags suggested when labelling a group of comments on a
 * board, shown under the "RetroTeam" heading next to a group's own tags.
 *
 * These live in code rather than in Firestore. The hosted commercial build
 * kept them in a `tags` collection that was populated by hand, so a
 * self-hosted install had none and the fetch threw — see
 * `useFetchRetroTeamTags`.
 *
 * The `id` is what the board matches on when it moves a tag between the
 * suggested list and a group, so it has to be stable: renaming a tag is fine,
 * changing its id detaches it from the groups already labelled with it.
 */
export const DEFAULT_TAGS: Tag[] = [
  { id: 'communication', name: 'Communication' },
  { id: 'collaboration', name: 'Collaboration' },
  { id: 'planning', name: 'Planning' },
  { id: 'estimation', name: 'Estimation' },
  { id: 'process', name: 'Process' },
  { id: 'tooling', name: 'Tooling' },
  { id: 'code-quality', name: 'Code quality' },
  { id: 'testing', name: 'Testing' },
  { id: 'deployment', name: 'Deployment' },
  { id: 'documentation', name: 'Documentation' },
  { id: 'meetings', name: 'Meetings' },
  { id: 'onboarding', name: 'Onboarding' },
  { id: 'technical-debt', name: 'Technical debt' },
  { id: 'dependencies', name: 'Dependencies' },
  { id: 'morale', name: 'Morale' },
  { id: 'workload', name: 'Workload' },
  { id: 'focus-time', name: 'Focus time' },
  { id: 'requirements', name: 'Requirements' },
  { id: 'stakeholders', name: 'Stakeholders' },
  { id: 'customer-feedback', name: 'Customer feedback' },
];

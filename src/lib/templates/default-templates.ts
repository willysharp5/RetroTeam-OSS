import { Templates } from './types/templates';

/**
 * @name DEFAULT_TEMPLATES
 * @description The retrospective formats that ship with the app.
 *
 * These live in code rather than in Firestore on purpose. In the commercial
 * build the `templates` collection was populated by hand in the hosted
 * project, which meant a fresh self-hosted install had an empty template
 * picker and no way to create a retrospective at all. Keeping them here means
 * they exist the moment the app boots, against the emulators or a brand new
 * Firebase project, with nothing to seed.
 *
 * Structure entries deliberately carry no `id`: one is generated per column
 * when a retrospective is created (see `useAddRetrospective`), so every board
 * gets its own ids and editing a board never affects the template.
 *
 * Teams that want their own formats can still add them — those are stored per
 * team in the `customTemplates` collection and read by `useGetCustomTemplates`.
 */
export const DEFAULT_TEMPLATES: Templates[] = [
  {
    id: 'start-stop-continue',
    title: 'Start, Stop, Continue',
    summary:
      'A quick, action-oriented format. Good default when you want the team to leave with concrete changes.',
    structure: [
      {
        name: 'Start',
        description: 'What should we begin doing?',
        order: 0,
      },
      {
        name: 'Stop',
        description: 'What should we stop doing?',
        order: 1,
      },
      {
        name: 'Continue',
        description: 'What is working that we should keep doing?',
        order: 2,
      },
    ],
  },
  {
    id: 'went-well-improve',
    title: 'What Went Well / What Could Improve',
    summary:
      'The classic retrospective. Simple enough that a team new to retros can run it without much facilitation.',
    structure: [
      {
        name: 'What went well',
        description: 'Wins worth repeating, however small.',
        order: 0,
      },
      {
        name: 'What could improve',
        description: 'Where did we lose time, quality or momentum?',
        order: 1,
      },
      {
        name: 'Action items',
        description: 'What will we actually change, and who owns it?',
        order: 2,
      },
    ],
  },
  {
    id: 'mad-sad-glad',
    title: 'Mad, Sad, Glad',
    summary:
      'Surfaces how the sprint felt, not just what shipped. Useful after a stressful or unusually rocky period.',
    structure: [
      {
        name: 'Mad',
        description: 'What frustrated you?',
        order: 0,
      },
      {
        name: 'Sad',
        description: 'What was disappointing?',
        order: 1,
      },
      {
        name: 'Glad',
        description: 'What made you happy?',
        order: 2,
      },
    ],
  },
  {
    id: 'four-ls',
    title: '4Ls',
    summary:
      'Separates learning from complaint. A good fit at the end of a project or a longer piece of work.',
    structure: [
      {
        name: 'Liked',
        description: 'What did you enjoy?',
        order: 0,
      },
      {
        name: 'Learned',
        description: 'What do you know now that you did not before?',
        order: 1,
      },
      {
        name: 'Lacked',
        description: 'What was missing that would have helped?',
        order: 2,
      },
      {
        name: 'Longed for',
        description: 'What did you wish you had?',
        order: 3,
      },
    ],
  },
  {
    id: 'sailboat',
    title: 'Sailboat',
    summary:
      'A visual metaphor that makes it easy to talk about goals and obstacles together. Works well with a mixed or quiet group.',
    structure: [
      {
        name: 'Wind',
        description: 'What is pushing us forward?',
        order: 0,
      },
      {
        name: 'Anchors',
        description: 'What is holding us back?',
        order: 1,
      },
      {
        name: 'Rocks',
        description: 'What risks are ahead of us?',
        order: 2,
      },
      {
        name: 'Island',
        description: 'What are we sailing towards?',
        order: 3,
      },
    ],
  },
  {
    id: 'starfish',
    title: 'Starfish',
    summary:
      'Finer grained than Start/Stop/Continue: it separates "do more of" from "start", which tends to produce more realistic actions.',
    structure: [
      {
        name: 'Keep doing',
        description: 'Working well as it is.',
        order: 0,
      },
      {
        name: 'More of',
        description: 'Working, and we want more of it.',
        order: 1,
      },
      {
        name: 'Less of',
        description: 'Not harmful, but we overdo it.',
        order: 2,
      },
      {
        name: 'Start doing',
        description: 'New things worth trying.',
        order: 3,
      },
      {
        name: 'Stop doing',
        description: 'Costing us more than it returns.',
        order: 4,
      },
    ],
  },
  {
    id: 'kalm',
    title: 'KALM',
    summary:
      'Keep, Add, Less, More. A compact format that fits a short timebox when the team already retros regularly.',
    structure: [
      {
        name: 'Keep',
        description: 'Valuable — leave it alone.',
        order: 0,
      },
      {
        name: 'Add',
        description: 'Not there yet — worth introducing.',
        order: 1,
      },
      {
        name: 'Less',
        description: 'Do less of this.',
        order: 2,
      },
      {
        name: 'More',
        description: 'Do more of this.',
        order: 3,
      },
    ],
  },
  {
    id: 'plus-delta',
    title: 'Plus / Delta',
    summary:
      'The shortest useful retrospective. Two columns, no ceremony — good for a 15 minute slot.',
    structure: [
      {
        name: 'Plus',
        description: 'What worked?',
        order: 0,
      },
      {
        name: 'Delta',
        description: 'What would we change next time?',
        order: 1,
      },
    ],
  },
];

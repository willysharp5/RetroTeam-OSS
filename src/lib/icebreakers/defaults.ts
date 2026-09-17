import { Icebreakers } from './types/icebreakers';

/**
 * @name DEFAULT_ICEBREAKERS
 * @description The icebreaker questions offered at the start of a board,
 * grouped by category.
 *
 * These live in code rather than in Firestore. The hosted commercial build
 * kept them in an `icebreakers` collection that was populated by hand, so a
 * self-hosted install started with an empty collection and the icebreaker
 * screen crashed outright — see `useIcebreakers`.
 *
 * A category key is shown in the UI with underscores replaced by spaces, so
 * `get_to_know_you` renders as "get to know you".
 *
 * Firestore is still read on top of these: any category you define in the
 * `icebreakers` collection is added to this list, and one with the same key
 * replaces the questions below. Nothing needs seeding for the feature to work.
 */
export const DEFAULT_ICEBREAKERS: Icebreakers = {
  get_to_know_you: [
    'What did you want to be when you grew up?',
    'What is the best piece of advice you have ever been given?',
    'Which three items would you take to a desert island?',
    'What is a skill you have that has nothing to do with your job?',
    'Where did you grow up, and what was it like?',
    'What is the last thing you learned that surprised you?',
    'Who has taught you the most about the work you do?',
    'What is your favourite way to spend a day off?',
    'What is something you have changed your mind about recently?',
    'What is the most memorable trip you have taken?',
  ],
  this_or_that: [
    'Early bird or night owl?',
    'Plan every detail or work it out as you go?',
    'Written docs or a quick call?',
    'Deep work in long blocks or short focused bursts?',
    'Sweet or savoury?',
    'Working from home or working from an office?',
    'Read the book or watch the adaptation?',
    'Finish one thing at a time or keep several moving?',
    'Mountains or the sea?',
    'Ship it and iterate, or polish it first?',
  ],
  light_hearted: [
    'What is the most useless talent you have?',
    'If your work this week were a film title, what would it be?',
    'What is the strangest food combination you genuinely enjoy?',
    'Which fictional character would be a nightmare to work with?',
    'What song would play as you walked into a meeting?',
    'What is the worst haircut you have ever had?',
    'If you had to eat one meal for a month, what would it be?',
    'What is a small thing that makes your day better?',
    'What household chore would you happily never do again?',
    'What is the best nickname you have ever been given?',
  ],
  looking_back: [
    'What is one thing you are proud of from this sprint?',
    'What surprised you most since we last met?',
    'What is something you learned the hard way recently?',
    'Which task took far longer than you expected, and why?',
    'Who helped you out recently, and how?',
    'What is one thing you would do differently if we started again?',
    'What was the most useful conversation you had this sprint?',
    'What did we decide last time that turned out well?',
    'What has been slowing you down that we have not talked about?',
    'What is one thing we should keep doing exactly as we are?',
  ],
};

/**
 * @name DEFAULT_ICEBREAKER_COLORS
 * @description The background tint for each category.
 *
 * The value is the palette portion of a Tailwind class, used as
 * `bg-${color}` — so it must be a colour and shade that
 * `tailwind.config.js` safelists (see the `bg-` pattern there), not an
 * arbitrary CSS colour.
 */
export const DEFAULT_ICEBREAKER_COLORS: Record<string, string> = {
  get_to_know_you: 'sky-100',
  this_or_that: 'amber-100',
  light_hearted: 'emerald-100',
  looking_back: 'violet-100',
};

/**
 * @name FALLBACK_ICEBREAKER_COLOR
 * @description Used for a category that has questions but no colour, which is
 * what happens when a self-hoster adds a category to Firestore without adding
 * a matching colour. The component interpolates the value straight into a
 * class name, so it has to be something rather than nothing.
 */
export const FALLBACK_ICEBREAKER_COLOR = 'zinc-100';

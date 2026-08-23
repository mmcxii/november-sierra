import { challengeDayNumber } from "@/lib/challenge/celebrations";

export type DayQuote = {
  author: string;
  text: string;
};

export type SourcedQuote = DayQuote & {
  /** Citation for verification. Not shown on the board. */
  source: string;
};

export const DAY_QUOTES: readonly SourcedQuote[] = [
  {
    author: "Marcus Aurelius",
    source: "Meditations 5.20, Gregory Hays",
    text: "The impediments to action advance action. What stands in the way becomes the way.",
  },
  {
    author: "Marcus Aurelius",
    source: "Meditations 10.16, Gregory Hays",
    text: "To stop talking about what the good man is like, and just be one.",
  },
  {
    author: "Marcus Aurelius",
    source: "Meditations 4.24, Gregory Hays",
    text: "If you seek tranquility, do less.",
  },
  {
    author: "Marcus Aurelius",
    source: "Meditations 4.7, Gregory Hays",
    text: "Choose not to be harmed — and you won’t feel harmed. Don’t feel harmed — and you haven’t been.",
  },
  {
    author: "Marcus Aurelius",
    source: "Meditations 4.8, Gregory Hays",
    text: "It can ruin your life only if it ruins your character. Otherwise it cannot harm you — inside or out.",
  },
  {
    author: "Marcus Aurelius",
    source: "Meditations 4.2, Gregory Hays",
    text: "No random actions, none not based on underlying principles.",
  },
  {
    author: "Marcus Aurelius",
    source: "Meditations 5.16, Gregory Hays",
    text: "The things you think about determine the quality of your mind. Your soul takes on the color of your thoughts.",
  },
  {
    author: "Marcus Aurelius",
    source: "Meditations 5.37, Gregory Hays",
    text: "True good fortune is what you make for yourself. Good fortune: good character, good intentions, and good actions.",
  },
  {
    author: "Marcus Aurelius",
    source: "Meditations 6.6, Gregory Hays",
    text: "The best revenge is not to be like that.",
  },
  {
    author: "Marcus Aurelius",
    source: "Meditations 6.51, Gregory Hays",
    text: "Ambition means tying your well-being to what other people say or do. Self-indulgence means tying it to the things that happen to you. Sanity means tying it to your own actions.",
  },
  {
    author: "Marcus Aurelius",
    source: "Meditations 7.56, Gregory Hays",
    text: "Think of yourself as dead. You have lived your life. Now take what’s left and live it properly.",
  },
  {
    author: "Marcus Aurelius",
    source: "Meditations 7.69, Gregory Hays",
    text: "Perfection of character: to live your last day, every day, without frenzy, or sloth, or pretence.",
  },
  {
    author: "Marcus Aurelius",
    source: "Meditations 8.22, Gregory Hays",
    text: "That is what you deserve. You should be good today. But instead you choose tomorrow.",
  },
  {
    author: "Marcus Aurelius",
    source: "Meditations 8.47, Gregory Hays",
    text: "External things are not the problem. It’s your assessment of them. Which you can erase right now.",
  },
  {
    author: "Marcus Aurelius",
    source: "Meditations 9.6, Gregory Hays",
    text: "Objective judgment, now, at this very moment. Unselfish action, now, at this very moment. Willing acceptance — now, at this very moment — of all external events. That’s all you need.",
  },
  {
    author: "Marcus Aurelius",
    source: "Meditations 9.13, Gregory Hays",
    text: "Today I escaped from anxiety. Or no, I discarded it, because it was within me, in my own perceptions — not outside.",
  },
  {
    author: "Marcus Aurelius",
    source: "Meditations 9.20, Gregory Hays",
    text: "Leave other people’s mistakes where they lie.",
  },
  {
    author: "Marcus Aurelius",
    source: "Meditations 10.12, Gregory Hays",
    text: "You can see what needs to be done. If you can see the road, follow it.",
  },
  {
    author: "Marcus Aurelius",
    source: "Meditations 11.13, Gregory Hays",
    text: "Someone despises me. That’s their problem. Mine: not to do or say anything despicable.",
  },
  {
    author: "Marcus Aurelius",
    source: "Meditations 11.18, Gregory Hays",
    text: "Kindness is invincible, provided it’s sincere — not ironic or an act.",
  },
  {
    author: "Marcus Aurelius",
    source: "Meditations 11.21, Gregory Hays",
    text: "If you don’t have a consistent goal in life, you can’t live it in a consistent way.",
  },
  {
    author: "Marcus Aurelius",
    source: "Meditations 12.4, Gregory Hays",
    text: "It never ceases to amaze me: we all love ourselves more than other people, but care more about their opinion than our own.",
  },
  {
    author: "Marcus Aurelius",
    source: "Meditations 12.25, Gregory Hays",
    text: "Throw out your misperceptions and you’ll be fine.",
  },
  {
    author: "Marcus Aurelius",
    source: "Meditations 2.5, Gregory Hays",
    text: "Concentrate every minute like a Roman — like a man — on doing what’s in front of you with precise and genuine seriousness, tenderly, willingly, with justice.",
  },
  {
    author: "Marcus Aurelius",
    source: "Meditations 2.11, Gregory Hays",
    text: "You could leave life right now. Let that determine what you do and say and think.",
  },
  {
    author: "Marcus Aurelius",
    source: "Meditations 5.1, Gregory Hays",
    text: "Or is this what I was created for? To huddle under the blankets and stay warm?",
  },
  {
    author: "Seneca",
    source: "Letters to Lucilius 13.4, Richard Gummere",
    text: "We suffer more often in imagination than in reality.",
  },
  {
    author: "Seneca",
    source: "On the Shortness of Life 1, John W. Basore",
    text: "It is not that we have a short time to live, but that we waste a great deal of it.",
  },
  {
    author: "Seneca",
    source: "Letters to Lucilius 1.2, Richard Gummere",
    text: "While we are postponing, life speeds by.",
  },
  {
    author: "Seneca",
    source: "Letters to Lucilius 71.3, Richard Gummere",
    text: "If a man does not know to what port he is steering, no wind is favourable to him.",
  },
  {
    author: "Seneca",
    source: "Letters to Lucilius 7.8, Richard Gummere",
    text: "Associate with those who will make a better man of you.",
  },
  {
    author: "Seneca",
    source: "Letters to Lucilius 101.10, Richard Gummere",
    text: "Begin at once to live, and count each separate day as a separate life.",
  },
  {
    author: "Seneca",
    source: "Letters to Lucilius 2.2, Richard Gummere",
    text: "To be everywhere is to be nowhere.",
  },
  {
    author: "Seneca",
    source: "Letters to Lucilius 2.6, Richard Gummere",
    text: "It is not the man who has too little, but the man who craves more, that is poor.",
  },
  {
    author: "Seneca",
    source: "On the Shortness of Life 9, John W. Basore",
    text: "The greatest obstacle to living is expectancy, which hangs upon tomorrow and loses today.",
  },
  {
    author: "Seneca",
    source: "On the Shortness of Life 3, John W. Basore",
    text: "You live as if you were destined to live forever, no thought of your frailty ever enters your head, of how much time has already gone by you take no heed.",
  },
  {
    author: "Seneca",
    source: "Letters to Lucilius 77.20, Richard Gummere",
    text: "As is a tale, so is life: not how long it is, but how good it is, is what matters.",
  },
  {
    author: "Seneca",
    source: "Letters to Lucilius 1.2, Richard Gummere",
    text: "Lay hold of today’s task, and you will not need to depend so much upon tomorrow’s.",
  },
  {
    author: "Seneca",
    source: "Letters to Lucilius 82.3, Richard Gummere",
    text: "Leisure without books is death, and burial of a man alive.",
  },
  {
    author: "Epictetus",
    source: "Enchiridion 1, W. A. Oldfather",
    text: "Some things are under our control, while others are not under our control.",
  },
  {
    author: "Epictetus",
    source: "Enchiridion 5, W. A. Oldfather",
    text: "It is not the things themselves that disturb men, but their judgements about these things.",
  },
  {
    author: "Epictetus",
    source: "Enchiridion 8, W. A. Oldfather",
    text: "Do not seek to have everything that happens happen as you wish, but wish for everything to happen as it actually does happen, and your life will be serene.",
  },
  {
    author: "Epictetus",
    source: "Enchiridion 13, W. A. Oldfather",
    text: "If you wish to make progress, then be content to appear senseless and foolish in externals, do not make it your wish to give the appearance of knowing anything.",
  },
  {
    author: "Epictetus",
    source: "Enchiridion 17, W. A. Oldfather",
    text: "Remember that you are an actor in a play, the character of which is determined by the Playwright.",
  },
  {
    author: "Epictetus",
    source: "Discourses 3.23.1, W. A. Oldfather",
    text: "Tell yourself, first of all, what kind of man you want to be; and then go ahead with what you are doing.",
  },
  {
    author: "Epictetus",
    source: "Enchiridion 14, W. A. Oldfather",
    text: "Whoever wants to be free, let him neither wish for anything, nor avoid anything, that is under the control of others; or else he is necessarily a slave.",
  },
  {
    author: "Epictetus",
    source: "Enchiridion 19, W. A. Oldfather",
    text: "You can be invincible if you never enter a contest in which victory is not under your control.",
  },
  {
    author: "Epictetus",
    source: "Enchiridion 1, W. A. Oldfather",
    text: "If it has to do with some one of the things not under our control, have ready to hand the answer, “It is nothing to me.”",
  },
  {
    author: "Musonius Rufus",
    source: "Fragment 51, Cora E. Lutz",
    text: "If one accomplishes some good though with toil, the toil passes, but the good remains; if one does something dishonorable with pleasure, the pleasure passes, but the dishonor remains.",
  },
  {
    author: "Musonius Rufus",
    source: "Lecture 6, Cora E. Lutz",
    text: "Virtue is not simply theoretical knowledge, but it is practical application as well.",
  },
  {
    author: "Musonius Rufus",
    source: "Lecture 7, Cora E. Lutz",
    text: "The man who is unwilling to exert himself almost always convicts himself as unworthy of good, since we gain every good by toil.",
  },
  {
    author: "James Clear",
    source: "Atomic Habits (2018); jamesclear.com/quote/atomic-habits",
    text: "You do not rise to the level of your goals. You fall to the level of your systems.",
  },
  {
    author: "James Clear",
    source: "Atomic Habits (2018); jamesclear.com/quote/atomic-habits",
    text: "Habits are the compound interest of self-improvement.",
  },
  {
    author: "James Clear",
    source: "Atomic Habits (2018); jamesclear.com/quote/atomic-habits",
    text: "Goals are good for setting a direction, but systems are best for making progress.",
  },
  {
    author: "James Clear",
    source: "Atomic Habits (2018); jamesclear.com/quote/atomic-habits",
    text: "You should be far more concerned with your current trajectory than with your current results.",
  },
  {
    author: "James Clear",
    source: "Atomic Habits (2018); jamesclear.com/quote/atomic-habits",
    text: "Every action you take is a vote for the type of person you wish to become.",
  },
  {
    author: "James Clear",
    source: "Atomic Habits (2018); jamesclear.com/quote/atomic-habits",
    text: "Missing once is an accident. Missing twice is the start of a new habit.",
  },
  {
    author: "James Clear",
    source: "Atomic Habits (2018); jamesclear.com/quote/atomic-habits",
    text: "Be the designer of your world and not merely the consumer of it.",
  },
  {
    author: "James Clear",
    source: "Atomic Habits (2018); jamesclear.com/quote/atomic-habits",
    text: "You get what you repeat.",
  },
  {
    author: "James Clear",
    source: "Atomic Habits (2018); jamesclear.com/quote/atomic-habits",
    text: "Success is the product of daily habits — not once-in-a-lifetime transformations.",
  },
  {
    author: "James Clear",
    source: "Atomic Habits (2018); jamesclear.com/quote/atomic-habits",
    text: "Some people spend their entire lives waiting for the time to be right to make an improvement.",
  },
  {
    author: "James Clear",
    source: "Atomic Habits (2018); jamesclear.com/quote/atomic-habits",
    text: "The greatest threat to success is not failure but boredom.",
  },
  {
    author: "James Clear",
    source: "Atomic Habits (2018); jamesclear.com/quote/atomic-habits",
    text: "It’s one thing to say I’m the type of person who wants this. It’s something very different to say I’m the type of person who is this.",
  },
  {
    author: "Ryan Holiday",
    source: "The Obstacle Is the Way (2014)",
    text: "The obstacle in the path becomes the path. Never forget, within every obstacle is an opportunity to improve our condition.",
  },
  {
    author: "Ryan Holiday",
    source: "Discipline Is Destiny (2022)",
    text: "You don’t have to always be amazing. You do always have to show up. What matters is sticking around for the next at bat.",
  },
  {
    author: "Ryan Holiday",
    source: "Ego Is the Enemy (2016)",
    text: "Ego is the enemy of what you want and of what you have.",
  },
  {
    author: "Ryan Holiday",
    source: "Ego Is the Enemy (2016)",
    text: "Silence is the respite of the confident and the strong.",
  },
  {
    author: "Ryan Holiday",
    source: "Ego Is the Enemy (2016)",
    text: "Ego is stolen. Confidence is earned.",
  },
  {
    author: "Ryan Holiday",
    source: "Stillness Is the Key (2019)",
    text: "Routine, done for long enough and done sincerely enough, becomes more than routine. It becomes ritual — it becomes sanctified and holy.",
  },
  {
    author: "Ryan Holiday",
    source: "Stillness Is the Key (2019)",
    text: "Remember, there’s no greatness in the future. Or clarity. Or insight. Or happiness. Or peace. There is only this moment.",
  },
  {
    author: "James Stockdale",
    source: "Spoken to Jim Collins; Good to Great (2001)",
    text: "You must never confuse faith that you will prevail in the end — which you can never afford to lose — with the discipline to confront the most brutal facts of your current reality, whatever they might be.",
  },
  {
    author: "James Stockdale",
    source: "Spoken to Jim Collins; Good to Great (2001)",
    text: "I never lost faith in the end of the story.",
  },
  {
    author: "James Stockdale",
    source: "Courage Under Fire (1993)",
    text: "Work with what you have control of and you’ll have your hands full.",
  },
  {
    author: "James Stockdale",
    source: "Courage Under Fire (1993)",
    text: "You can only be a victim of yourself. It’s all in how you discipline your mind.",
  },
  {
    author: "James Stockdale",
    source: "Courage Under Fire (1993)",
    text: "Treat your station in life with indifference, not with contempt, only with indifference.",
  },
];

function seedFromTeamId(teamId: string): number {
  let hash = 2166136261;
  for (let index = 0; index < teamId.length; index += 1) {
    hash ^= teamId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffledQuoteOrder(teamId: string): number[] {
  const order = DAY_QUOTES.map((_, index) => {
    return index;
  });
  const random = mulberry32(seedFromTeamId(teamId));
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = order[index];
    const other = order[swapIndex];
    if (current == null || other == null) {
      continue;
    }
    order[index] = other;
    order[swapIndex] = current;
  }
  return order;
}

export function quoteForTeamDay(args: { date: string; startDate: string; teamId: string }): null | DayQuote {
  const dayNumber = challengeDayNumber(args.startDate, args.date);
  if (dayNumber == null) {
    return null;
  }
  const quote = DAY_QUOTES[shuffledQuoteOrder(args.teamId)[dayNumber - 1] ?? -1];
  if (quote == null) {
    return null;
  }
  return { author: quote.author, text: quote.text };
}

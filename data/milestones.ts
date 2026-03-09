export interface MilestoneCategory {
  title: string;
  items: string[];
}

export interface MilestoneData {
  month: number;
  label: string;
  categories: MilestoneCategory[];
}

export const CDC_MILESTONES: MilestoneData[] = [
  {
    month: 1,
    label: "1 Month",
    categories: [
      {
        title: "Social/Emotional",
        items: [
          "Looks at parent's face",
          "Calms down when picked up or spoken to"
        ]
      },
      {
        title: "Language/Communication",
        items: [
          "Has different cries for different needs (hunger, tired, wet)",
          "Makes brief, short vowel sounds"
        ]
      },
      {
        title: "Cognitive",
        items: [
          "Looks at things 8-12 inches away",
          "Follows a moving object briefly with eyes"
        ]
      },
      {
        title: "Movement/Physical",
        items: [
          "Keeps hands in tight fists",
          "Brings hands near face",
          "Moves head from side to side when on stomach"
        ]
      }
    ]
  },
  {
    month: 2,
    label: "2 Months",
    categories: [
      {
        title: "Social/Emotional",
        items: [
          "Smiles at people",
          "Can briefly calm himself (may bring hands to mouth and suck on hand)",
          "Tries to look at parent"
        ]
      },
      {
        title: "Language/Communication",
        items: [
          "Coos, makes gurgling sounds",
          "Turns head toward sounds"
        ]
      },
      {
        title: "Cognitive",
        items: [
          "Pays attention to faces",
          "Begins to follow things with eyes and recognize people at a distance",
          "Begins to act bored (cries, fussy) if activity doesn't change"
        ]
      },
      {
        title: "Movement/Physical",
        items: [
          "Can hold head up and begins to push up when lying on tummy",
          "Makes smoother movements with arms and legs"
        ]
      }
    ]
  },
  {
    month: 4,
    label: "4 Months",
    categories: [
      {
        title: "Social/Emotional",
        items: [
          "Smiles spontaneously, especially at people",
          "Likes to play with people and might cry when playing stops",
          "Copies some movements and facial expressions, like smiling or frowning"
        ]
      },
      {
        title: "Language/Communication",
        items: [
          "Begins to babble",
          "Babbles with expression and copies sounds he hears",
          "Cries in different ways to show hunger, pain, or being tired"
        ]
      },
      {
        title: "Cognitive",
        items: [
          "Lets you know if she is happy or sad",
          "Responds to affection",
          "Reaches for toy with one hand",
          "Uses hands and eyes together, such as seeing a toy and reaching for it",
          "Follows moving things with eyes from side to side",
          "Watches faces closely"
        ]
      },
      {
        title: "Movement/Physical",
        items: [
          "Holds head steady, unsupported",
          "Pushes down on legs when feet are on a hard surface",
          "May be able to roll over from tummy to back",
          "Can hold a toy and shake it and swing at dangling toys",
          "Brings hands to mouth",
          "When lying on stomach, pushes up to elbows"
        ]
      }
    ]
  },
  {
    month: 6,
    label: "6 Months",
    categories: [
      {
        title: "Social/Emotional",
        items: [
          "Knows familiar faces and begins to know if someone is a stranger",
          "Likes to play with others, especially parents",
          "Responds to other people's emotions and often seems happy",
          "Likes to look at self in a mirror"
        ]
      },
      {
        title: "Language/Communication",
        items: [
          "Responds to sounds by making sounds",
          "Strings vowels together when babbling (\"ah,\" \"eh,\" \"oh\") and likes taking turns with parent while making sounds",
          "Responds to own name",
          "Makes sounds to show joy and displeasure",
          "Begins to say consonant sounds (jabbering with \"m,\" \"b\")"
        ]
      },
      {
        title: "Cognitive",
        items: [
          "Looks around at things nearby",
          "Brings things to mouth",
          "Shows curiosity about things and tries to get things that are out of reach",
          "Begins to pass things from one hand to the other"
        ]
      },
      {
        title: "Movement/Physical",
        items: [
          "Rolls over in both directions (front to back, back to front)",
          "Begins to sit without support",
          "When standing, supports weight on legs and might bounce",
          "Rocks back and forth, sometimes crawling backward before moving forward"
        ]
      }
    ]
  },
  {
    month: 9,
    label: "9 Months",
    categories: [
      {
        title: "Social/Emotional",
        items: [
          "May be afraid of strangers",
          "May be clingy with familiar adults",
          "Has favorite toys"
        ]
      },
      {
        title: "Language/Communication",
        items: [
          "Understands \"no\"",
          "Makes a lot of different sounds like \"mamamama\" and \"babababa\"",
          "Copies sounds and gestures of others",
          "Uses fingers to point at things"
        ]
      },
      {
        title: "Cognitive",
        items: [
          "Watches the path of something as it falls",
          "Looks for things he sees you hide",
          "Plays peek-a-boo",
          "Puts things in her mouth",
          "Moves things smoothly from one hand to the other",
          "Picks up things like cereal o's between thumb and index finger"
        ]
      },
      {
        title: "Movement/Physical",
        items: [
          "Stands, holding on",
          "Can get into sitting position",
          "Sits without support",
          "Pulls to stand",
          "Crawls"
        ]
      }
    ]
  },
  {
    month: 12,
    label: "1 Year",
    categories: [
      {
        title: "Social/Emotional",
        items: [
          "Is shy or nervous with strangers",
          "Cries when mom or dad leaves",
          "Has favorite things and people",
          "Shows fear in some situations",
          "Hands you a book when he wants to hear a story",
          "Repeats sounds or actions to get attention",
          "Puts out arm or leg to help with dressing",
          "Plays games such as \"peek-a-boo\" and \"pat-a-cake\""
        ]
      },
      {
        title: "Language/Communication",
        items: [
          "Responds to simple spoken requests",
          "Uses simple gestures, like shaking head \"no\" or waving \"bye-bye\"",
          "Makes sounds with changes in tone (sounds more like speech)",
          "Says \"mama\" and \"dada\" and exclamations like \"uh-oh!\"",
          "Tries to say words you say"
        ]
      },
      {
        title: "Cognitive",
        items: [
          "Explores things in different ways, like shaking, banging, throwing",
          "Finds hidden things easily",
          "Looks at the right picture or thing when it's named",
          "Copies gestures",
          "Starts to use things correctly; for example, drinks from a cup, brushes hair",
          "Bangs two things together",
          "Puts things in a container, takes things out of a container",
          "Lets things go without help",
          "Pokes with index (pointer) finger",
          "Follows simple directions like \"pick up the toy\""
        ]
      },
      {
        title: "Movement/Physical",
        items: [
          "Gets to a sitting position without help",
          "Pulls up to stand, walks holding on to furniture (\"cruising\")",
          "May take a few steps without holding on",
          "May stand alone"
        ]
      }
    ]
  },
  {
    month: 15,
    label: "15 Months",
    categories: [
      {
        title: "Social/Emotional",
        items: [
          "Copies other children while playing, like taking toys out of a container when another child does",
          "Shows you an object she likes",
          "Claps when excited",
          "Hugs stuffed doll or other toy",
          "Shows you affection (hugs, cuddles, or kisses you)"
        ]
      },
      {
        title: "Language/Communication",
        items: [
          "Tries to say one or two words besides \"mama\" or \"dada,\" like \"ba\" for ball or \"da\" for dog",
          "Looks at a familiar object when you name it",
          "Follows directions given with both a gesture and words. For example, he gives you a toy when you hold out your hand and say, \"Give me the toy.\"",
          "Points to ask for something or to get help"
        ]
      },
      {
        title: "Cognitive",
        items: [
          "Tries to use things the right way, like a phone, cup, or book",
          "Stacks at least two small objects, like blocks"
        ]
      },
      {
        title: "Movement/Physical",
        items: [
          "Takes a few steps on his own",
          "Uses fingers to feed herself some food"
        ]
      }
    ]
  },
  {
    month: 18,
    label: "18 Months",
    categories: [
      {
        title: "Social/Emotional",
        items: [
          "Moves away from you, but looks to make sure you are close by",
          "Points to show you something interesting",
          "Puts hands out for you to wash them",
          "Looks at a few pages in a book with you",
          "Helps you dress him by pushing arm through sleeve or lifting up foot"
        ]
      },
      {
        title: "Language/Communication",
        items: [
          "Tries to say three or more words besides \"mama\" or \"dada\"",
          "Follows one-step directions without any gestures, like giving you the toy when you say, \"Give it to me.\""
        ]
      },
      {
        title: "Cognitive",
        items: [
          "Copies you doing chores, like sweeping with a broom",
          "Plays with toys in a simple way, like pushing a toy car"
        ]
      },
      {
        title: "Movement/Physical",
        items: [
          "Walks without holding on to anyone or anything",
          "Scribbles",
          "Drinks from a cup without a lid and may spill sometimes",
          "Feeds herself with her fingers",
          "Tries to use a spoon",
          "Climbs on and off a couch or chair without help"
        ]
      }
    ]
  },
  {
    month: 24,
    label: "2 Years",
    categories: [
      {
        title: "Social/Emotional",
        items: [
          "Notices when others are hurt or upset, like pausing or looking sad when someone is crying",
          "Looks at your face to see how to react in a new situation"
        ]
      },
      {
        title: "Language/Communication",
        items: [
          "Points to things in a book when you ask, like \"Where is the bear?\"",
          "Says at least two words together, like \"More milk.\"",
          "Points to at least two body parts when you ask him to show you",
          "Uses more gestures than just waving and pointing, like blowing a kiss or nodding yes"
        ]
      },
      {
        title: "Cognitive",
        items: [
          "Holds something in one hand while using the other hand; for example, holding a container and taking the lid off",
          "Tries to use switches, knobs, or buttons on a toy",
          "Plays with more than one toy at the same time, like putting toy food on a toy plate"
        ]
      },
      {
        title: "Movement/Physical",
        items: [
          "Kicks a ball",
          "Runs",
          "Walks (not climbs) up a few stairs with or without help",
          "Eats with a spoon"
        ]
      }
    ]
  }
];

export const getMilestoneForAge = (months: number): MilestoneData | null => {
  const availableMonths = CDC_MILESTONES.map(m => m.month).sort((a, b) => a - b);
  
  // Find the largest milestone month that is <= current age
  let targetMonth = availableMonths.slice().reverse().find(m => m <= months);
  
  // If they are younger than the first milestone, just show the first one
  if (targetMonth === undefined) {
    targetMonth = availableMonths[0];
  }
  
  return CDC_MILESTONES.find(m => m.month === targetMonth) || null;
};

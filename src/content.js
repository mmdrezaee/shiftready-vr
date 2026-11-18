// Fictional site procedure, roles, coach knowledge base.

export const PROCEDURE = {
  code: 'SP-CON-012',
  rev: 'Rev. 3',
  title: 'Site Safety Procedure: Mobile Equipment, Lifting, Edges and Excavations',
  page: 'Page 4 of 22',
  note: 'Fictional sample written for this training demo. Not a real site rule.',
};

export const RULES = {
  crane: {
    no: '3.2', short: 'Suspended loads',
    text: 'Never walk or work under a suspended load. Use the barricaded walkway when the crane is lifting.',
    area: 'the crane load path, right of the building',
    keys: ['crane', 'load', 'suspended', 'lift', 'lifting', 'hook', 'rebar', 'under'],
  },
  edge: {
    no: '4.1', short: 'Open edges',
    text: 'Every open edge more than 3 m up needs a guardrail. If a rail is removed, the area is closed or workers are tied off.',
    area: 'the top floor of the building',
    keys: ['edge', 'height', 'heights', 'fall', 'guardrail', 'rail', 'harness', 'tie', 'floor', 'roof'],
  },
  trench: {
    no: '5.4', short: 'Trenches',
    text: 'No one enters a trench deeper than 1.5 m unless it is shored or a trench box is in place.',
    area: 'the trench on the right',
    keys: ['trench', 'excavation', 'dig', 'shoring', 'box', 'cave', 'collapse', 'deep', 'ladder'],
  },
  reverse: {
    no: '6.2', short: 'Reversing trucks',
    text: 'Trucks reverse only with a spotter. Never walk behind a reversing vehicle.',
    area: 'the dump truck by the stockpile on the left',
    keys: ['reverse', 'reversing', 'backing', 'truck', 'spotter', 'behind', 'alarm', 'dump'],
  },
  swing: {
    no: '6.5', short: 'Excavator swing',
    text: 'Stay out of the swing radius of an operating excavator. Get the operator\'s attention and wait for a signal first.',
    area: 'the excavator in the middle of the yard',
    keys: ['excavator', 'swing', 'radius', 'operator', 'digger', 'bucket', 'counterweight'],
  },
  power: {
    no: '7.3', short: 'Overhead power lines',
    text: 'Booms and loads stay outside the limit of approach to overhead power lines. A dedicated spotter watches any work near them.',
    area: 'the boom truck under the power line on the left',
    keys: ['power', 'line', 'lines', 'electric', 'electrical', 'boom', 'overhead', 'wire', 'wires', 'contact'],
  },
};

export const CATS = ['crane', 'edge', 'trench', 'reverse', 'swing', 'power'];

export const ROLES = {
  new: { label: 'New worker', skill: 0.3, window: 12, hint: 0.55 },
  trade: { label: 'Experienced trade worker', skill: 0.55, window: 10, hint: 0.4 },
  super: { label: 'Site supervisor', skill: 0.7, window: 8, hint: 0.25 },
};

export const SITUATIONS_PER_SHIFT = 8;

export const BADGES = {
  first: 'First catch',
  sharp: 'Sharp eyes (under 2.5 s)',
  hattrick: 'Hat trick (3 in a row)',
  bounce: 'Bounce back',
  clean: 'Clean shift',
};

export const FAQ = [
  {
    keys: ['why', 'train', 'way', 'vr', 'virtual', 'purpose', 'point'],
    a: 'Reading a procedure is not the same as spotting the hazard on a busy site. Here each rule becomes a live situation, and I track what you notice and how fast.',
  },
  {
    keys: ['fictional', 'real', 'actual', 'official', 'legal', 'law', 'regulation'],
    a: 'SP-CON-012 is a fictional procedure written for this demo. Always follow your own site\'s procedures and the provincial OHS rules.',
  },
  {
    keys: ['score', 'points', 'streak', 'scoring', 'badge', 'badges'],
    a: 'Each catch earns 100 points plus up to 100 for speed, multiplied by your streak. False alarms and misses reset the streak.',
  },
  {
    keys: ['how', 'play', 'click', 'controls', 'select', 'use'],
    a: 'Watch the site. When you see someone or something breaking a rule, point at it and pull the trigger, or click it with the mouse.',
  },
  {
    keys: ['hello', 'hi', 'hey', 'who'],
    a: 'I\'m Riley, your site safety coach. Ask me about any rule on the procedure page.',
  },
];

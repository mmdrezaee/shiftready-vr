// Fictional site procedure, roles, coach knowledge base.

export const PROCEDURE = {
  code: 'SP-CON-012',
  rev: 'Rev. 3',
  title: 'Site-Specific Orientation and Access Requirements',
  site: 'Riverside Mid-Rise, Phase 2',
  page: 'Page 7 of 32',
  pages: 32,
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
  env: {
    no: '8.1', short: 'Protected ground',
    text: 'Vehicles stay on the haul road and marked routes. Never drive onto the fenced protected area: its topsoil and wildlife corridor must be restored when the project ends.',
    area: 'the fenced protected area on the right, past the trench',
    keys: ['environment', 'environmental', 'wildlife', 'topsoil', 'protected', 'ground', 'fence', 'pickup', 'animal', 'animals', 'restore', 'reclamation', 'corridor', 'grass'],
  },
};

export const CATS = ['crane', 'edge', 'trench', 'reverse', 'swing', 'power', 'env'];

// The orientation document as a worker would normally read it. Rule paragraphs carry the
// category they turn into; the rest is the surrounding text that makes real procedures long.
export const DOC_PAGES = [
  {
    no: 7,
    paras: [
      { h: '3.1 Application', t: 'This section applies to all workers, subcontractors and visitors entering the site. Where it conflicts with a task-specific work plan, the more stringent requirement applies. Complete this orientation before every new site assignment and sign the attendance record.' },
      { cat: 'crane', h: '3.2 Suspended loads', t: 'No person shall stand, walk or work beneath a suspended load. During lifting operations, pedestrian traffic shall use the barricaded walkway only, as directed by the signaller (Lift Plan LP-07).' },
      { h: '3.4 Personal protective equipment', t: 'CSA-approved footwear, hard hat, Class 2 high-visibility apparel and safety glasses are required beyond the site office. Workers on respirator tasks shall be clean-shaven at the seal area.' },
      { cat: 'edge', h: '4.1 Open edges', t: 'Every open edge more than 3 m above the level below shall be protected by a guardrail. Where a guardrail section is removed for material handling, the area shall be closed off or every worker within 2 m of the edge shall be tied off to an approved anchor.' },
      { cat: 'trench', h: '5.4 Trenches', t: 'No worker shall enter a trench deeper than 1.5 m unless the walls are shored or sloped or a trench box is in place. Spoil shall be kept at least 1 m back from the edge (Section 5.6).' },
      { cat: 'reverse', h: '6.2 Reversing vehicles', t: 'Trucks shall reverse only under the direction of a designated spotter. No person shall walk or stand in the path of a reversing vehicle, regardless of backup alarm status.' },
      { cat: 'swing', h: '6.5 Excavator swing', t: 'No person shall enter the swing radius of an operating excavator. Make eye contact with the operator and wait for a clear signal before approaching.' },
      { h: '6.8 Site roads', t: 'The speed limit on all site roads is 15 km/h. Light vehicles yield to heavy equipment at all times.' },
      { cat: 'power', h: '7.3 Overhead power lines', t: 'Booms, loads and attachments shall remain outside the limit of approach (7 m for lines up to 250 kV). A dedicated spotter shall watch any work within 15 m of the line.' },
      { cat: 'env', h: '8.1 Protected ground', t: 'Vehicles shall use the haul road and marked routes only. No vehicle shall enter the fenced environmentally sensitive area: its topsoil and wildlife corridor must be restored to pre-construction condition at project close (Environmental Protection Plan EPP-02).' },
      { h: '8.3 Wildlife', t: 'Do not feed or approach wildlife. Report sightings to the site supervisor. Food waste goes in the sealed bins at the site office only.' },
    ],
  },
  {
    no: 8,
    paras: [
      { h: '9.1 Emergency response', t: 'On hearing three long blasts of the air horn, stop work, make equipment safe and walk to the muster point at the site office. Do not return until the site supervisor gives the all clear.' },
      { h: '9.2 First aid', t: 'First aid kits are kept in the site office and in every supervisor vehicle. Report every injury, however minor, before the end of the shift.' },
      { h: '9.4 Fire', t: 'Hot work requires a permit and a fire watch for 60 minutes after the work ends. Fire extinguishers are located at each stair core and on the tower crane base.' },
      { h: '9.6 Severe weather', t: 'Crane operations stop when wind speed exceeds the limit in the lift plan. Lightning within 10 km stops all work at height and all crane work.' },
      { h: '10.1 Housekeeping', t: 'Keep walkways, stairs and access routes clear. Store materials at least 2 m back from open edges. Remove waste daily to the marked bins.' },
      { h: '10.3 Site amenities', t: 'Washrooms and the lunch room are in the site office. Smoking is permitted only in the marked area by the main gate.' },
      { h: '11.1 Hazard reporting', t: 'Report every hazard, near miss and incident to your supervisor the same shift. Every worker has the right to refuse unsafe work.' },
      { h: '11.2 Site access', t: 'Sign in and out at the gate every day. Visitors must be escorted at all times. Site access cards are not transferable.' },
    ],
  },
  {
    no: 9,
    paras: [
      { h: '12.1 Traffic management', t: 'Delivery vehicles enter through Gate 2 only and follow the traffic control person. Deliveries are scheduled through the site office at least 24 hours ahead.' },
      { h: '12.2 Laydown areas', t: 'Materials are stored only in the marked laydown areas. Stacks over 1.8 m require bracing or banding.' },
      { h: '12.4 Ladders and scaffolds', t: 'Ladders extend 1 m above the landing and are tied off. Scaffolds are inspected and tagged before every shift; a red tag means do not use.' },
      { h: '13.1 Noise', t: 'Hearing protection is required in areas marked with the hearing sign and within 10 m of operating equipment.' },
      { h: '13.2 Dust and silica', t: 'Use water or local exhaust when cutting concrete. Dry sweeping of silica dust is not permitted.' },
      { h: '14.1 Fitness for work', t: 'Workers must be fit for duty. Report any medication that may affect alertness to your supervisor before starting work.' },
      { h: '14.3 Orientation record', t: 'This orientation is valid for this site only. Workers transferring from another site must complete it again before entry.' },
    ],
  },
];

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
    a: 'Orientation documents are read before every new site and rarely practised. Here each rule on this site\'s own page becomes a live situation, and I track what you notice and how fast. Spot every rule and you are cleared for site entry.',
  },
  {
    keys: ['clear', 'cleared', 'clearance', 'entry', 'access', 'pass', 'passed', 'orientation'],
    a: 'To be cleared for site entry, spot a breach of every rule on the page at least once in a shift. Any rule you miss comes first in the next shift.',
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
    a: 'I\'m Riley, your site coach. Ask me about any rule on the orientation page.',
  },
];

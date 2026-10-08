import l1 from '../notes/l1-knowledge-and-epistemology.md?raw';
import l2 from '../notes/l2-ethical-dilemma.md?raw';
import l3 from '../notes/l3-intro-to-ethics.md?raw';
import l4 from '../notes/l4-professional-ethics.md?raw';
import l5 from '../notes/l5-ethical-issues.md?raw';
import l6 from '../notes/l6-netiquette.md?raw';
import l7 from '../notes/l7-software-piracy.md?raw';
import l8 from '../notes/l8-privacy-secrecy.md?raw';
import l9 from '../notes/l9-intellectual-property.md?raw';
import l10 from '../notes/l10-computer-crimes.md?raw';

export interface Lecture {
  id: string;
  title: string;
  md: string;
}

export const LECTURES: Lecture[] = [
  { id: 'l1', title: 'L1 Knowledge and Epistemology', md: l1 },
  { id: 'l2', title: 'L2 Ethical Dilemma', md: l2 },
  { id: 'l3', title: 'L3 Intro to Ethics', md: l3 },
  { id: 'l4', title: 'L4 Professional Ethics', md: l4 },
  { id: 'l5', title: 'L5 Ethical Issues', md: l5 },
  { id: 'l6', title: 'L6 Netiquette', md: l6 },
  { id: 'l7', title: 'L7 Software Piracy', md: l7 },
  { id: 'l8', title: 'L8 Privacy Secrecy', md: l8 },
  { id: 'l9', title: 'L9 Intellectual Property', md: l9 },
  { id: 'l10', title: 'L10 Computer Crimes', md: l10 },
];

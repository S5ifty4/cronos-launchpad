export type LaunchCard = {
  name: string;
  symbol: string;
  creator: string;
  progress: number;
  reserveRaised: string;
  graduationTarget: string;
  age: string;
  antiBot: boolean;
  protectedName: boolean;
  vvsGraduation: boolean;
  taxBips: number;
  marketCap: string;
  volume24h: string;
  description: string;
  status: 'Launching' | 'Near graduation' | 'Graduated';
  socials: string[];
  color: string;
};

export const launches: LaunchCard[] = [
  {
    name: 'Crojack Protocol',
    symbol: 'CROJACK',
    creator: '0x6819...a923',
    progress: 41.7,
    reserveRaised: '27,105 CRO',
    graduationTarget: '65,000 CRO',
    age: '18m',
    antiBot: true,
    protectedName: true,
    vvsGraduation: true,
    taxBips: 0,
    marketCap: '$18.4k',
    volume24h: '$2.7k',
    description: 'A protected Cronos meme launch with VVS-first graduation and public LP lock receipts.',
    status: 'Launching',
    socials: ['X', 'Web'],
    color: '#4CDBFF',
  },
  {
    name: 'Meme VVS Runner',
    symbol: 'MVVS',
    creator: '0x7610...1b29',
    progress: 88.2,
    reserveRaised: '57,330 CRO',
    graduationTarget: '65,000 CRO',
    age: '2h',
    antiBot: true,
    protectedName: true,
    vvsGraduation: true,
    taxBips: 0,
    marketCap: '$39.8k',
    volume24h: '$8.1k',
    description: 'Near graduation runner with anti-snipe launch rules and configurable VVS router path.',
    status: 'Near graduation',
    socials: ['X', 'Telegram'],
    color: '#9afcff',
  },
  {
    name: 'Crofessor',
    symbol: 'CROF',
    creator: '0x4200...7ad1',
    progress: 12.4,
    reserveRaised: '8,060 CRO',
    graduationTarget: '65,000 CRO',
    age: '6m',
    antiBot: true,
    protectedName: true,
    vvsGraduation: true,
    taxBips: 0,
    marketCap: '$6.2k',
    volume24h: '$940',
    description: 'Education-themed test launch showing trust badges, creator profile, and blocked clone checks.',
    status: 'Launching',
    socials: ['Web'],
    color: '#ffffff',
  },
  {
    name: 'Blue Chain Gecko',
    symbol: 'BCG',
    creator: '0x0c0a...19e8',
    progress: 100,
    reserveRaised: '65,000 CRO',
    graduationTarget: '65,000 CRO',
    age: '1d',
    antiBot: true,
    protectedName: true,
    vvsGraduation: true,
    taxBips: 0,
    marketCap: '$72.5k',
    volume24h: '$14.2k',
    description: 'Graduated sample state for the VVS pair, LP vault, and proof panel UX.',
    status: 'Graduated',
    socials: ['X', 'Web', 'Dex'],
    color: '#2f83ff',
  },
];

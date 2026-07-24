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
  },
];

import type { Launch } from './types';

export type ExploreTab = 'all' | 'launching' | 'near' | 'graduated' | 'no-tax';

export type ExploreFilterState = {
  tab: ExploreTab;
  query: string;
};

function matchesTab(launch: Launch, tab: ExploreTab) {
  if (tab === 'launching') return launch.status === 'Launching';
  if (tab === 'near') return launch.status === 'Near graduation';
  if (tab === 'graduated') return launch.status === 'Graduated';
  if (tab === 'no-tax') return launch.taxBips === 0;
  return true;
}

function searchableText(launch: Launch) {
  return [
    launch.name,
    launch.symbol,
    launch.creator,
    launch.description,
    launch.status,
    ...launch.socials,
  ].join(' ').toLowerCase();
}

export function filterLaunches(launches: Launch[], filters: ExploreFilterState) {
  const query = filters.query.trim().toLowerCase();
  return launches.filter((launch) => matchesTab(launch, filters.tab) && (!query || searchableText(launch).includes(query)));
}

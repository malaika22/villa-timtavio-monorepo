import { StatusTabFilterConfig } from './type';

export const TABS: StatusTabFilterConfig[] = [
  { id: 'active', label: 'ACTIVE', sectionLabel: 'Active Requests' },
  { id: 'all', label: 'ALL', sectionLabel: 'All Requests' },
  { id: 'today', label: 'TODAY', sectionLabel: "Today's Requests" },
];

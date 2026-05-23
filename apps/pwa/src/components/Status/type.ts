import { StatusRequest } from './mockData';

export type StatusTabId = 'active' | 'all' | 'today';

export interface StatusTabFilterProps {
  activeTab: StatusTabId;
  setActiveTab: (tab: StatusTabId) => void;
}

export interface RequestCardProps {
  request: StatusRequest;
  onSelect: (id: number) => void;
}

export interface StatusSectionLabelProps {
  activeTab: StatusTabId;
}

export interface StatusTabFilterConfig {
  id: StatusTabId;
  label: string;
  sectionLabel: string;
}

export interface RequestSectionProps {
  visibleRequests: StatusRequest[];
  onSelect: (id: number) => void;
}

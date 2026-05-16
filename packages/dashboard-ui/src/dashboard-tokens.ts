/** Shared Tailwind class maps for Owner (intel) and Estate Manager dashboards */
export type DashboardVariant = 'intel' | 'manager';

export const dashboardTokens: Record<
  DashboardVariant,
  {
    card: string;
    cardShadow: string;
    border: string;
    main: string;
    text: string;
    textMuted: string;
    accent: string;
    accentHover: string;
    success: string;
    successBg: string;
    warning: string;
    warningBg: string;
    danger: string;
    dangerBg: string;
    info: string;
    infoBg: string;
    sidebar: string;
    sidebarActive: string;
    navMuted: string;
    navSection: string;
    sidebarWidth: string;
    sectionTitle: string;
  }
> = {
  intel: {
    card: 'bg-intel-card',
    cardShadow: 'shadow-[0_1px_2px_rgba(26,22,20,0.04)]',
    border: 'border-intel-border',
    main: 'bg-intel-main',
    text: 'text-intel-text',
    textMuted: 'text-intel-text-muted',
    accent: 'text-intel-maroon',
    accentHover: 'hover:text-intel-maroon-muted',
    success: 'text-intel-success',
    successBg: 'bg-intel-success-bg',
    warning: 'text-intel-warning',
    warningBg: 'bg-intel-warning-bg',
    danger: 'text-intel-peach',
    dangerBg: 'bg-intel-peach-bg',
    info: 'text-intel-info',
    infoBg: 'bg-intel-info-bg',
    sidebar: 'bg-intel-sidebar',
    sidebarActive: 'bg-intel-sidebar-active',
    navMuted: 'text-intel-nav-muted',
    navSection: 'text-intel-nav-section',
    sidebarWidth: 'w-intel-sidebar',
    sectionTitle: 'font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]',
  },
  manager: {
    card: 'bg-manager-card rounded-xl',
    cardShadow: 'shadow-[0_1px_3px_rgba(26,22,20,0.06)]',
    border: 'border-manager-border',
    main: 'bg-manager-main',
    text: 'text-manager-text',
    textMuted: 'text-manager-text-muted',
    accent: 'text-manager-accent',
    accentHover: 'hover:text-manager-accent-muted',
    success: 'text-manager-success',
    successBg: 'bg-manager-success-bg',
    warning: 'text-manager-warning',
    warningBg: 'bg-manager-warning-bg',
    danger: 'text-manager-danger',
    dangerBg: 'bg-manager-danger-bg',
    info: 'text-manager-info',
    infoBg: 'bg-manager-info-bg',
    sidebar: 'bg-manager-sidebar',
    sidebarActive: 'bg-manager-sidebar-active',
    navMuted: 'text-manager-nav-muted',
    navSection: 'text-manager-nav-section',
    sidebarWidth: 'w-manager-sidebar',
    sectionTitle: 'font-cormorant text-[22px] leading-tight font-normal text-[#1a1614]',
  },
};

export const getDashboardTokens = (variant: DashboardVariant) => dashboardTokens[variant];

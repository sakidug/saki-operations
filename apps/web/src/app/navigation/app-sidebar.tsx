import { Sidebar, type SidebarItem } from '@saki-operations/ui';
import { useAppTranslation } from '@saki-operations/i18n';

export type AppSidebarProps = {
  items: Array<SidebarItem & { active?: boolean }>;
  open: boolean;
  onNavigate: (href: string) => void;
};

export function AppSidebar({ items, open, onNavigate }: AppSidebarProps) {
  const { t } = useAppTranslation();

  return (
    <Sidebar
      title={t('app.name')}
      items={items}
      open={open}
      onNavigate={onNavigate}
      aria-label={t('nav.sidebar')}
      className="lg:relative lg:shrink-0"
    />
  );
}

import { BottomNavigation, type BottomNavItem } from '@saki-operations/ui';
import { useAppTranslation } from '@saki-operations/i18n';

export type AppBottomNavProps = {
  items: BottomNavItem[];
  activeHref?: string;
  onNavigate: (href: string) => void;
};

export function AppBottomNav({ items, activeHref, onNavigate }: AppBottomNavProps) {
  const { t } = useAppTranslation();

  return (
    <BottomNavigation
      items={items}
      activeHref={activeHref}
      onNavigate={onNavigate}
      aria-label={t('nav.bottom')}
    />
  );
}

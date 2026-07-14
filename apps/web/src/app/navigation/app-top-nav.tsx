import { Link, useNavigate } from 'react-router-dom';
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  LanguageSelector,
  TopNavigation,
} from '@saki-operations/ui';
import { useAppTranslation, useLocale, type AppLocale } from '@saki-operations/i18n';
import { Bell } from 'lucide-react';

import { useSession } from '@/app/bootstrap/session-provider';
import { paths } from '@/app/router/paths';
import { getInitials } from '@/lib/get-initials';

export type AppTopNavProps = {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  /** Unread notification count — 0 until notifications module lands. */
  unreadCount?: number;
};

export function AppTopNav({
  onMenuClick,
  showMenuButton = true,
  unreadCount = 0,
}: AppTopNavProps) {
  const { t } = useAppTranslation();
  const { locale, setLocale } = useLocale();
  const { user } = useSession();
  const navigate = useNavigate();

  const initials = user ? getInitials(user.displayName) : '?';

  return (
    <TopNavigation
      title={t('app.name')}
      subtitle={user ? user.displayName : t('app.tagline')}
      menuLabel={t('nav.menu')}
      onMenuClick={onMenuClick}
      showMenuButton={showMenuButton}
      trailing={
        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSelector
            value={locale}
            label={t('languages.selector')}
            onChange={(code) => void setLocale(code as AppLocale)}
            options={[
              { code: 'si', label: t('languages.si'), flag: '🇱🇰' },
              { code: 'en', label: t('languages.en'), flag: '🇬🇧' },
            ]}
          />

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="relative"
            aria-label={
              unreadCount > 0
                ? t('dashboard.topBar.notificationsUnread', { count: unreadCount })
                : t('dashboard.topBar.notifications')
            }
            onClick={() => navigate(paths.notifications)}
          >
            <Bell className="size-4" aria-hidden />
            {unreadCount > 0 ? (
              <Badge
                variant="danger"
                className="absolute -right-0.5 -top-0.5 min-w-4 justify-center px-1 py-0 text-[10px] leading-4"
                aria-hidden
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            ) : null}
          </Button>

          <Button
            asChild
            variant="ghost"
            size="icon-sm"
            className="rounded-full p-0"
            aria-label={t('dashboard.topBar.profile')}
          >
            <Link to={paths.profile}>
              <Avatar className="size-8 ring-1 ring-border">
                <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>
          </Button>
        </div>
      }
    />
  );
}

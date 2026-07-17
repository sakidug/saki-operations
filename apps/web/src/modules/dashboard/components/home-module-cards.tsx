import { Link } from 'react-router-dom';
import { canAccessModule, type ModuleAccessKey } from '@saki-operations/constants';
import { useAppTranslation } from '@saki-operations/i18n';
import { cn } from '@saki-operations/ui';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Car, HardHat } from 'lucide-react';

import { useSession } from '@/app/bootstrap/session-provider';
import { paths } from '@/app/router/paths';
import { fadeUpTransition } from '@/lib/motion';

type ModuleDef = {
  key: 'tours' | 'hhco';
  module: ModuleAccessKey;
  to: string;
  brand: 'tours' | 'hhco';
  icon: typeof Car;
  features: string[];
};

const MODULES: ModuleDef[] = [
  {
    key: 'tours',
    module: 'tours',
    to: paths.sakiTours,
    brand: 'tours',
    icon: Car,
    features: [
      'dashboard.modules.tours.features.weddings',
      'dashboard.modules.tours.features.airport',
      'dashboard.modules.tours.features.tours',
    ],
  },
  {
    key: 'hhco',
    module: 'hhco',
    to: paths.hhco,
    brand: 'hhco',
    icon: HardHat,
    features: ['dashboard.modules.hhco.features.deliveries'],
  },
];

export function HomeModuleCards() {
  const { t } = useAppTranslation();
  const { user } = useSession();
  const reduceMotion = useReducedMotion();
  // H-05 — same permission filter as operations tools / route guards.
  const visible = MODULES.filter((mod) =>
    user ? canAccessModule(user.permissions, mod.module) : false,
  );

  if (visible.length === 0) return null;

  return (
    <motion.section
      aria-label={t('dashboard.modules.region')}
      className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fadeUpTransition(reduceMotion, 0.06)}
    >
      {visible.map((mod, index) => {
        const Icon = mod.icon;
        return (
          <motion.div
            key={mod.key}
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={fadeUpTransition(reduceMotion, 0.08 + index * 0.05)}
            whileHover={reduceMotion ? undefined : { y: -2 }}
            whileTap={reduceMotion ? undefined : { scale: 0.985 }}
          >
            <Link
              to={mod.to}
              data-brand={mod.brand}
              className={cn(
                'glass group relative flex h-full min-h-[13.5rem] flex-col overflow-hidden rounded-2xl border border-glass-border p-5 outline-none transition duration-200',
                'hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'sm:min-h-[15rem] sm:p-6',
              )}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_hsl(var(--primary)/0.22),_transparent_55%)]"
              />
              <div className="relative flex flex-1 flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-2xl bg-primary/15 p-3 text-primary shadow-sm [&_svg]:size-7 sm:[&_svg]:size-8">
                    <Icon aria-hidden />
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-primary opacity-90 transition group-hover:opacity-100">
                    {t('dashboard.modules.tapToEnter')}
                    <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                    {t(`dashboard.modules.${mod.key}.title`)}
                  </h2>
                  <p className="text-sm text-muted-foreground sm:text-base">
                    {t(`dashboard.modules.${mod.key}.description`)}
                  </p>
                </div>

                <ul className="mt-auto flex flex-wrap gap-2 pt-1">
                  {mod.features.map((featureKey) => (
                    <li
                      key={featureKey}
                      className="rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                    >
                      {t(featureKey)}
                    </li>
                  ))}
                </ul>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </motion.section>
  );
}

import * as React from 'react';

import { cn } from '../lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';

export type ModuleCardProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
};

export function ModuleCard({
  title,
  description,
  icon,
  badge,
  href,
  onClick,
  className,
}: ModuleCardProps) {
  const content = (
    <>
      <CardHeader className="mb-0 flex-row items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {icon ? (
            <div className="rounded-xl bg-primary/15 p-2.5 text-primary [&_svg]:size-5">{icon}</div>
          ) : null}
          <div className="min-w-0 space-y-1">
            <CardTitle className="truncate">{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
        </div>
        {badge ? <Badge variant="secondary">{badge}</Badge> : null}
      </CardHeader>
    </>
  );

  const classes = cn('glass group transition hover:brightness-110', className);

  if (href) {
    return (
      <a href={href} className={cn(classes, 'block')} onClick={onClick}>
        <Card variant="glass" padding="md" className="border-0 bg-transparent p-0 shadow-none">
          {content}
        </Card>
      </a>
    );
  }

  return (
    <Card variant="glass" className={classes} onClick={onClick} role={onClick ? 'button' : undefined}>
      {content}
    </Card>
  );
}

export type DashboardCardProps = {
  title: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

export function DashboardCard({ title, children, action, className }: DashboardCardProps) {
  return (
    <Card variant="glass" className={cn('h-full', className)}>
      <CardHeader className="mb-4 flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export type TripCardProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  status?: React.ReactNode;
  leading?: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export function TripCard({ title, subtitle, meta, status, leading, className, onClick }: TripCardProps) {
  return (
    <Card
      variant="glass"
      className={cn('flex items-center gap-3', onClick && 'cursor-pointer hover:brightness-110', className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {leading ? <div className="shrink-0 text-primary [&_svg]:size-5">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold">{title}</p>
          {status}
        </div>
        {subtitle ? <p className="truncate text-sm text-muted-foreground">{subtitle}</p> : null}
        {meta ? <p className="mt-1 text-xs text-muted-foreground">{meta}</p> : null}
      </div>
    </Card>
  );
}

export type VehicleCardProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  plate?: React.ReactNode;
  status?: React.ReactNode;
  image?: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export function VehicleCard({
  title,
  subtitle,
  plate,
  status,
  image,
  className,
  onClick,
}: VehicleCardProps) {
  return (
    <Card
      variant="glass"
      className={cn('overflow-hidden p-0', onClick && 'cursor-pointer hover:brightness-110', className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      padding="none"
    >
      {image ? <div className="aspect-[16/9] w-full overflow-hidden bg-muted">{image}</div> : null}
      <div className="space-y-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold">{title}</p>
          {status}
        </div>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        {plate ? <p className="text-xs font-medium text-primary">{plate}</p> : null}
      </div>
    </Card>
  );
}

export type ProfileCardProps = {
  name: React.ReactNode;
  role?: React.ReactNode;
  meta?: React.ReactNode;
  avatar: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function ProfileCard({ name, role, meta, avatar, actions, className }: ProfileCardProps) {
  return (
    <Card variant="glass" className={cn('flex items-center gap-3', className)}>
      <div className="shrink-0">{avatar}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{name}</p>
        {role ? <p className="truncate text-sm text-muted-foreground">{role}</p> : null}
        {meta ? <p className="truncate text-xs text-muted-foreground">{meta}</p> : null}
      </div>
      {actions}
    </Card>
  );
}

export type StatCardProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  delta?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
};

export function StatCard({ label, value, delta, icon, className }: StatCardProps) {
  return (
    <Card variant="glass" className={cn('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
          {delta ? <p className="text-xs text-muted-foreground">{delta}</p> : null}
        </div>
        {icon ? (
          <div className="rounded-xl bg-primary/15 p-2 text-primary [&_svg]:size-5">{icon}</div>
        ) : null}
      </div>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import {
  Button,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui';
import { cn } from '@repo/ui/lib/utils';
import { Check, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import type { EstateSettings, StaffRole } from '@repo/api-types';

import {
  useSettings,
  useUpdateSettings,
  useStaffAccounts,
  useCreateStaff,
  useUpdateStaff,
  useIntegrations,
} from '@/hooks/useSettings';

const NOTIFY_KEYS: { key: keyof EstateSettings; label: string }[] = [
  { key: 'notifyNewInquiry', label: 'New inquiry' },
  { key: 'notifyNewRequest', label: 'New experience request' },
  { key: 'notifyTaskOverdue', label: 'Task overdue' },
  { key: 'notifyInventoryLow', label: 'Inventory low' },
  { key: 'notifyLodgifyError', label: 'Lodgify sync error' },
  { key: 'notifyStripeError', label: 'Stripe error' },
];

export const SettingsPage = () => {
  return (
    <Tabs defaultValue="staff" className="flex flex-col gap-5">
      <TabsList className="h-9 w-fit border border-manager-border bg-manager-card p-1">
        <TabsTrigger value="staff">Staff</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
        <TabsTrigger value="pricing">Pricing</TabsTrigger>
      </TabsList>

      <TabsContent value="staff" className="w-full">
        <StaffTab />
      </TabsContent>
      <TabsContent value="notifications">
        <NotificationsTab />
      </TabsContent>
      <TabsContent value="integrations">
        <IntegrationsTab />
      </TabsContent>
      <TabsContent value="pricing">
        <PricingTab />
      </TabsContent>
    </Tabs>
  );
};

// ─── Staff ──────────────────────────────────────────────────────────────────

function StaffTab() {
  const { data: staff = [], isLoading } = useStaffAccounts();
  const create = useCreateStaff();
  const update = useUpdateStaff();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('ESTATE_MANAGER');

  const add = () => {
    if (!name.trim() || !email.trim()) return;
    create.mutate(
      { name: name.trim(), email: email.trim(), role },
      {
        onSuccess: () => {
          toast.success('Staff member added');
          setName('');
          setEmail('');
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-manager-border bg-manager-card p-4">
        <p className="mb-3 text-sm font-semibold text-manager-text">
          Add staff member
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-44"
          />
          <Input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-56"
          />
          <RolePicker value={role} onChange={setRole} />
          <Button
            className="gap-1.5 bg-manager-accent text-white hover:bg-manager-accent-muted"
            disabled={create.isPending || !name.trim() || !email.trim()}
            onClick={add}
          >
            <Plus className="size-4" /> Add
          </Button>
        </div>
        <p className="mt-2 text-xs text-manager-text-muted">
          Read-only accounts can view everything but cannot log charges, approve
          requests, or check out.
        </p>
      </div>

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-xl bg-manager-border" />
      ) : (
        <ul className="divide-y divide-manager-border rounded-xl border border-manager-border bg-manager-card">
          {staff.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-manager-text">
                  {s.name}
                  {!s.active ? (
                    <span className="ml-2 rounded-full bg-manager-main px-2 py-0.5 text-xs text-manager-text-muted">
                      Deactivated
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-manager-text-muted">{s.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <RolePicker
                  value={s.role}
                  onChange={(r) =>
                    update.mutate({ id: s.id, dto: { role: r } })
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    update.mutate({ id: s.id, dto: { active: !s.active } })
                  }
                >
                  {s.active ? 'Deactivate' : 'Reactivate'}
                </Button>
              </div>
            </li>
          ))}
          {staff.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-manager-text-muted">
              No staff accounts yet.
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}

function RolePicker({
  value,
  onChange,
}: {
  value: StaffRole;
  onChange: (r: StaffRole) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-manager-border p-0.5">
      {(['ESTATE_MANAGER', 'READ_ONLY'] as StaffRole[]).map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={cn(
            'rounded px-2.5 py-1 text-xs font-medium transition-colors',
            value === r
              ? 'bg-manager-accent text-white'
              : 'text-manager-text-muted hover:text-manager-text',
          )}
        >
          {r === 'ESTATE_MANAGER' ? 'Manager' : 'Read-only'}
        </button>
      ))}
    </div>
  );
}

// ─── Notifications ──────────────────────────────────────────────────────────

function NotificationsTab() {
  const { data: settings, isLoading } = useSettings();
  const update = useUpdateSettings();

  if (isLoading || !settings) {
    return <div className="h-48 animate-pulse rounded-xl bg-manager-border" />;
  }

  return (
    <ul className="divide-y divide-manager-border rounded-xl border border-manager-border bg-manager-card">
      {NOTIFY_KEYS.map(({ key, label }) => {
        const enabled = Boolean(settings[key]);
        return (
          <li
            key={key}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <span className="text-sm text-manager-text">{label}</span>
            <Toggle
              enabled={enabled}
              onChange={() => update.mutate({ [key]: !enabled })}
            />
          </li>
        );
      })}
    </ul>
  );
}

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        enabled ? 'bg-manager-accent' : 'bg-manager-border',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform',
          enabled ? 'left-0.5 translate-x-5' : 'left-0.5',
        )}
      />
    </button>
  );
}

// ─── Integrations ───────────────────────────────────────────────────────────

function IntegrationsTab() {
  const { data: integrations = [], isLoading } = useIntegrations();

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-xl bg-manager-border" />;
  }

  return (
    <ul className="divide-y divide-manager-border rounded-xl border border-manager-border bg-manager-card">
      {integrations.map((i) => (
        <li
          key={i.key}
          className="flex items-center justify-between gap-3 px-4 py-3"
        >
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                'size-2 rounded-full',
                i.connected ? 'bg-[#1e7e34]' : 'bg-[#b45309]',
              )}
            />
            <div>
              <p className="text-sm font-medium text-manager-text">{i.name}</p>
              <p className="text-xs text-manager-text-muted">
                {i.connected ? 'Connected' : 'Not configured'}
                {i.lastSyncAt ? ` · synced ${safeDate(i.lastSyncAt)}` : ''}
              </p>
            </div>
          </div>
          {!i.connected ? (
            <Button variant="outline" size="sm" disabled>
              Reconnect
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1e7e34]">
              <Check className="size-3.5" /> Live
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function safeDate(iso: string) {
  try {
    return format(parseISO(iso), 'MMM d, h:mm a');
  } catch {
    return iso;
  }
}

// ─── Pricing ────────────────────────────────────────────────────────────────

function PricingTab() {
  const { data: settings, isLoading } = useSettings();
  const update = useUpdateSettings();

  const [base, setBase] = useState('');
  const [tax, setTax] = useState('');
  const [service, setService] = useState('');
  const [prevSettings, setPrevSettings] = useState(settings);

  if (settings !== prevSettings) {
    setPrevSettings(settings);
    if (settings) {
      setBase(String(settings.villaBaseRate));
      setTax(String(Math.round(settings.taxRate * 10000) / 100));
      setService(String(Math.round(settings.serviceChargeRate * 10000) / 100));
    }
  }

  if (isLoading || !settings) {
    return <div className="h-48 animate-pulse rounded-xl bg-manager-border" />;
  }

  const save = () => {
    update.mutate(
      {
        villaBaseRate: Number(base) || 0,
        taxRate: (Number(tax) || 0) / 100,
        serviceChargeRate: (Number(service) || 0) / 100,
      },
      {
        onSuccess: () => toast.success('Pricing updated'),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  return (
    <div className="max-w-md space-y-4 rounded-xl border border-manager-border bg-manager-card p-5">
      <Field label="Villa base rate ($ / night)">
        <Input
          type="number"
          min={0}
          value={base}
          onChange={(e) => setBase(e.target.value)}
        />
      </Field>
      <Field label="Tax / IVA (%)">
        <Input
          type="number"
          min={0}
          step="0.01"
          value={tax}
          onChange={(e) => setTax(e.target.value)}
        />
      </Field>
      <Field label="Service charge (%)">
        <Input
          type="number"
          min={0}
          step="0.01"
          value={service}
          onChange={(e) => setService(e.target.value)}
        />
      </Field>
      <Button
        className="bg-manager-accent text-white hover:bg-manager-accent-muted"
        disabled={update.isPending}
        onClick={save}
      >
        Save pricing
      </Button>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-manager-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

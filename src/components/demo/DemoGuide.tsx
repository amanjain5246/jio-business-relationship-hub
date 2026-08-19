import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sparkles, X, ArrowRight, Lock, Smartphone, Calendar } from 'lucide-react';

interface DemoGuideProps {
  onNavigate: (path: string) => void;
}

const STEPS = [
  {
    icon: Sparkles,
    title: 'Run a Guided Discovery',
    description: 'Open Tata Motors → Discovery tab → Start Guided Discovery. Answer that the customer is dissatisfied and see it auto-create an Issue, update Customer 360, and log accountability history.',
    action: '/accounts/acc-002',
    cta: 'Open Tata Motors',
  },
  {
    icon: Lock,
    title: 'Approve a protected-field change',
    description: 'GST/PAN/Legal Name can\'t be edited directly. Review the pending GST correction request for Tata Motors and Approve, Reject, or ask for clarification.',
    action: '/update-requests',
    cta: 'Open Update Requests',
  },
  {
    icon: Smartphone,
    title: 'Complete an interaction in Mobile URM',
    description: 'Log a call end-to-end: capture issues, opportunities and commitments, generate an internal MOM plus a redacted customer-facing summary, and schedule the next meeting.',
    action: '/mobile-urm',
    cta: 'Open Mobile URM',
  },
  {
    icon: Calendar,
    title: 'Reschedule or cancel a meeting',
    description: 'Every meeting supports reschedule and cancellation with a required reason and a visible history — plus a live conflict warning if two meetings overlap.',
    action: '/calendar',
    cta: 'Open Calendar',
  },
];

export function DemoGuide({ onNavigate }: DemoGuideProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <Card className="border-brand-200 bg-gradient-to-br from-brand-50/60 to-white">
      <CardBody className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide">Evaluator quick start</p>
            <h3 className="font-display font-semibold text-ink-900 text-base mt-0.5">Try the end-to-end demo flow</h3>
            <p className="text-sm text-ink-500 mt-1">Four steps that exercise every major workflow in this prototype, in the order they build on each other.</p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 -m-1 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition shrink-0"
            aria-label="Dismiss demo guide"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="flex gap-3 p-3.5 rounded-xl bg-white border border-ink-100">
                <div className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 relative">
                  <Icon className="h-4 w-4" />
                  <span className="absolute -top-1.5 -left-1.5 h-4 w-4 rounded-full bg-brand-600 text-white text-[9px] font-bold flex items-center justify-center">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-900">{s.title}</p>
                  <p className="text-xs text-ink-500 mt-1 leading-relaxed">{s.description}</p>
                  <Button size="sm" variant="primary" className="mt-2.5" onClick={() => onNavigate(s.action)}>
                    {s.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

import { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatINR, formatDate } from '@/utils/format';
import { TrendingUp, Search } from 'lucide-react';
import type { OpportunityStage } from '@/types/models';

const stageTone: Record<OpportunityStage, 'brand' | 'amber' | 'green' | 'red' | 'blue'> = {
  Discovery: 'blue',
  Qualification: 'brand',
  Proposal: 'amber',
  Negotiation: 'amber',
  'Closed Won': 'green',
  'Closed Lost': 'red',
};

export function OpportunitiesPage() {
  const { data, updateOpportunity } = useStore();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<OpportunityStage | 'all'>('all');
  const [editOpp, setEditOpp] = useState<string | null>(null);
  const [editStage, setEditStage] = useState<OpportunityStage>('Discovery');
  const [editProb, setEditProb] = useState('0');

  const filtered = data.opportunities.filter((o) => {
    const acc = data.accounts.find((a) => a.id === o.accountId);
    const matchesSearch = o.name.toLowerCase().includes(search.toLowerCase()) || (acc?.name.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStage = stageFilter === 'all' || o.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const totalPipeline = filtered
    .filter((o) => o.stage !== 'Closed Won' && o.stage !== 'Closed Lost')
    .reduce((sum, o) => sum + o.value, 0);
  const weightedPipeline = filtered
    .filter((o) => o.stage !== 'Closed Won' && o.stage !== 'Closed Lost')
    .reduce((sum, o) => sum + o.value * (o.probability / 100), 0);
  const wonValue = data.opportunities.filter((o) => o.stage === 'Closed Won').reduce((sum, o) => sum + o.value, 0);

  const oppBeingEdited = editOpp ? data.opportunities.find((o) => o.id === editOpp) : null;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Opportunities"
        subtitle={`${data.opportunities.length} opportunities in pipeline`}
        icon={<TrendingUp className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-ink-400 font-medium uppercase tracking-wide">Total Pipeline</p>
          <p className="font-display text-2xl font-bold text-ink-900 mt-1">{formatINR(totalPipeline)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-ink-400 font-medium uppercase tracking-wide">Weighted Forecast</p>
          <p className="font-display text-2xl font-bold text-brand-600 mt-1">{formatINR(weightedPipeline)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-ink-400 font-medium uppercase tracking-wide">Closed Won</p>
          <p className="font-display text-2xl font-bold text-emerald-600 mt-1">{formatINR(wonValue)}</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            type="text"
            placeholder="Search opportunities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="flex items-center bg-ink-100 rounded-lg p-0.5 overflow-x-auto">
          {(['all', 'Discovery', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStageFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${stageFilter === s ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<TrendingUp className="h-7 w-7" />} title="No opportunities found" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((opp) => {
            const acc = data.accounts.find((a) => a.id === opp.accountId);
            return (
              <Card key={opp.id} hover>
                <CardBody className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-ink-900">{opp.name}</h3>
                      <p className="text-xs text-ink-400 mt-0.5">{acc?.name} · {opp.owner}</p>
                    </div>
                    <Badge tone={stageTone[opp.stage]}>{opp.stage}</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-display text-lg font-bold text-ink-900">{formatINR(opp.value)}</span>
                    <div className="flex-1">
                      <ProgressBar value={opp.probability} tone={opp.probability >= 60 ? 'green' : opp.probability >= 30 ? 'amber' : 'red'} showLabel />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-ink-100">
                    <p className="text-xs text-ink-400">Close: {formatDate(opp.expectedClose)}</p>
                    <Button size="sm" onClick={() => { setEditOpp(opp.id); setEditStage(opp.stage); setEditProb(String(opp.probability)); }}>
                      Update
                    </Button>
                  </div>
                  <p className="text-xs text-ink-500 bg-ink-50 rounded-lg p-2">{opp.nextStep}</p>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={!!oppBeingEdited}
        onClose={() => setEditOpp(null)}
        title="Update Opportunity"
        footer={
          <>
            <Button onClick={() => setEditOpp(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => {
              if (editOpp) {
                updateOpportunity(editOpp, {
                  stage: editStage,
                  probability: Number(editProb) || 0,
                  updatedAt: new Date().toISOString().split('T')[0],
                });
              }
              setEditOpp(null);
            }}>
              Save
            </Button>
          </>
        }
      >
        {oppBeingEdited && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-ink-700">{oppBeingEdited.name}</p>
              <p className="text-xs text-ink-400 mt-1">{formatINR(oppBeingEdited.value)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-700 mb-2 block">Stage</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Discovery', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setEditStage(s)}
                    className={`py-2.5 rounded-lg border-2 text-sm font-medium transition ${editStage === s ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600 hover:border-ink-300'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-700 mb-2 block">Probability (%)</label>
              <input type="number" min="0" max="100" value={editProb} onChange={(e) => setEditProb(e.target.value)} className="input" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

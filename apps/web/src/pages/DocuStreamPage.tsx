import { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  FileText,
  Image,
  Pill,
  TestTube,
  ClipboardList,
  Package,
  CheckCircle2,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCaseStore, type InvestigationOrder } from '@/stores/case.store';

type PipelineStage = 'ordered' | 'uploaded' | 'delivered';

interface DocCard {
  id: string;
  title: string;
  type: 'lab' | 'imaging' | 'prescription' | 'discharge' | 'report';
  patientName: string;
  timestamp: string;
  stage: PipelineStage;
  priority?: 'urgent' | 'normal';
  investigationOrderId?: string;
}

const DOC_TYPE_CONFIG: Record<DocCard['type'], { icon: typeof FileText; color: string; darkColor: string; label: string }> = {
  lab: { icon: TestTube, color: 'bg-emerald-100 text-emerald-600', darkColor: 'dark:bg-emerald-950/50 dark:text-emerald-400', label: 'Lab Report' },
  imaging: { icon: Image, color: 'bg-blue-100 text-blue-600', darkColor: 'dark:bg-blue-950/50 dark:text-blue-400', label: 'Imaging' },
  prescription: { icon: Pill, color: 'bg-violet-100 text-violet-600', darkColor: 'dark:bg-violet-950/50 dark:text-violet-400', label: 'Prescription' },
  discharge: { icon: ClipboardList, color: 'bg-amber-100 text-amber-600', darkColor: 'dark:bg-amber-950/50 dark:text-amber-400', label: 'Discharge' },
  report: { icon: FileText, color: 'bg-gray-100 text-gray-600', darkColor: 'dark:bg-gray-800 dark:text-gray-400', label: 'Report' },
};

const STAGE_CONFIG: Record<PipelineStage, { label: string; color: string; headerBg: string; dotColor: string; icon: typeof Clock; badge: string }> = {
  ordered: {
    label: 'Ordered',
    color: 'text-blue-700 dark:text-blue-300',
    headerBg: 'bg-blue-50/80 border-blue-200/60 dark:bg-blue-950/30 dark:border-blue-800/40',
    dotColor: 'bg-blue-500',
    icon: Package,
    badge: 'badge-blue',
  },
  uploaded: {
    label: 'Uploaded',
    color: 'text-amber-700 dark:text-amber-300',
    headerBg: 'bg-amber-50/80 border-amber-200/60 dark:bg-amber-950/30 dark:border-amber-800/40',
    dotColor: 'bg-amber-500',
    icon: Upload,
    badge: 'badge-amber',
  },
  delivered: {
    label: 'Delivered',
    color: 'text-emerald-700 dark:text-emerald-300',
    headerBg: 'bg-emerald-50/80 border-emerald-200/60 dark:bg-emerald-950/30 dark:border-emerald-800/40',
    dotColor: 'bg-emerald-500',
    icon: CheckCircle2,
    badge: 'badge-emerald',
  },
};

const STAGES_ORDER: PipelineStage[] = ['ordered', 'uploaded', 'delivered'];

function PipelineDots({ currentStage }: { currentStage: PipelineStage }) {
  const currentIdx = STAGES_ORDER.indexOf(currentStage);
  return (
    <div className="flex items-center gap-1">
      {STAGES_ORDER.map((stage, i) => (
        <div key={stage} className="flex items-center">
          <div
            className={`h-2 w-2 rounded-full transition-colors ${
              i <= currentIdx ? STAGE_CONFIG[stage].dotColor : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
          {i < STAGES_ORDER.length - 1 && (
            <div className={`h-px w-3 ${i < currentIdx ? 'bg-gray-400 dark:bg-gray-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function DocumentCard({ doc, index, onAdvance }: { doc: DocCard; index: number; onAdvance?: (id: string) => void }) {
  const typeConfig = DOC_TYPE_CONFIG[doc.type];
  const Icon = typeConfig.icon;
  const canAdvance = STAGES_ORDER.indexOf(doc.stage) < STAGES_ORDER.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -2, boxShadow: '0 8px 25px -5px rgba(0,0,0,0.1), 0 4px 10px -6px rgba(0,0,0,0.05)' }}
      onClick={() => canAdvance && onAdvance?.(doc.id)}
      className={`group rounded-xl border border-gray-200/60 bg-white/90 dark:bg-gray-900/80 dark:border-gray-700/60 p-4 shadow-sm backdrop-blur-sm transition-all ${canAdvance ? 'cursor-pointer hover:border-emerald-300/60' : ''}`}
      title={canAdvance ? 'Click to advance to next stage' : 'Delivered'}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${typeConfig.color} ${typeConfig.darkColor}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{doc.title}</h4>
            {doc.priority === 'urgent' && (
              <span className="badge-red shrink-0 text-[10px]">Urgent</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{doc.patientName}</p>
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[11px] text-gray-400 dark:text-gray-500">{doc.timestamp}</span>
            <PipelineDots currentStage={doc.stage} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function KanbanColumn({ stage, documents, onAdvance }: { stage: PipelineStage; documents: DocCard[]; onAdvance?: (id: string) => void }) {
  const config = STAGE_CONFIG[stage];
  const StageIcon = config.icon;

  return (
    <div className="flex min-w-[300px] flex-1 flex-col rounded-2xl border border-gray-200/60 bg-gray-50/50 dark:border-gray-800/60 dark:bg-gray-900/30 backdrop-blur-sm">
      <div className={`flex items-center gap-2 rounded-t-2xl border-b-2 px-4 py-3.5 ${config.headerBg}`}>
        <StageIcon className={`h-4 w-4 ${config.color}`} />
        <h3 className={`text-sm font-bold ${config.color}`}>{config.label}</h3>
        <span className={`ml-auto ${config.badge}`}>
          {documents.length}
        </span>
      </div>

      <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-3" style={{ maxHeight: 'calc(100vh - 340px)' }}>
        {documents.map((doc, i) => (
          <DocumentCard key={doc.id} doc={doc} index={i} onAdvance={onAdvance} />
        ))}
        {documents.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-8 text-gray-300 dark:text-gray-600">
            <FileText className="h-8 w-8" />
            <p className="mt-2 text-xs font-medium">No documents</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DocuStreamPage() {
  const storeInvestigations = useCaseStore((s) => s.investigationOrders);
  const updateInvestigationStatus = useCaseStore((s) => s.updateInvestigationStatus);

  const storeDocuments = useMemo<DocCard[]>(() => {
    return storeInvestigations.map((inv) => {
      const stageMap: Record<string, PipelineStage> = { ordered: 'ordered', uploaded: 'uploaded', delivered: 'delivered' };
      return {
        id: inv.id,
        title: inv.name,
        type: 'lab' as const,
        patientName: inv.patientName,
        timestamp: inv.orderedAt ? new Date(inv.orderedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Unknown',
        stage: stageMap[inv.status] || 'ordered',
        investigationOrderId: inv.id,
      };
    });
  }, [storeInvestigations]);

  const MOCK_DOCUMENTS: DocCard[] = [
    { id: 'DOC-001', title: 'Complete Blood Count', type: 'lab', patientName: 'Rajesh Sharma', timestamp: '10 min ago', stage: 'ordered' },
    { id: 'DOC-002', title: 'Chest X-Ray PA View', type: 'imaging', patientName: 'Priya Nair', timestamp: '25 min ago', stage: 'ordered' },
    { id: 'DOC-003', title: 'ECG Report', type: 'report', patientName: 'Amit Patel', timestamp: '30 min ago', stage: 'ordered', priority: 'urgent' },
    { id: 'DOC-004', title: 'Lipid Profile Panel', type: 'lab', patientName: 'Deepa Krishnan', timestamp: '45 min ago', stage: 'uploaded' },
    { id: 'DOC-005', title: 'MRI Brain - Contrast', type: 'imaging', patientName: 'Arjun Malhotra', timestamp: '1 hr ago', stage: 'uploaded' },
    { id: 'DOC-006', title: 'HbA1c Report', type: 'lab', patientName: 'Sunita Gupta', timestamp: '5 hr ago', stage: 'delivered' },
    { id: 'DOC-007', title: 'X-Ray Knee AP/Lateral', type: 'imaging', patientName: 'Manoj Deshmukh', timestamp: '5 hr ago', stage: 'delivered' },
  ];

  const combinedInitial = useMemo(() => {
    const storeIds = new Set(storeDocuments.map((d) => d.id));
    return [...storeDocuments, ...MOCK_DOCUMENTS.filter((d) => !storeIds.has(d.id))];
  }, [storeDocuments]);

  const [documents, setDocuments] = useState(combinedInitial);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mergedDocuments = useMemo(() => {
    const storeMap = new Map(storeDocuments.map((d) => [d.id, d]));
    return documents.map((d) => {
      const fromStore = storeMap.get(d.id);
      return fromStore ? { ...d, stage: fromStore.stage } : d;
    });
  }, [documents, storeDocuments]);

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const newDocs: DocCard[] = Array.from(files).map((file, i) => ({
      id: `DOC-${Date.now()}-${i}`,
      title: file.name.replace(/\.[^.]+$/, ''),
      type: 'report' as const,
      patientName: 'New Upload',
      timestamp: 'Just now',
      stage: 'ordered' as PipelineStage,
    }));
    setDocuments((prev) => [...newDocs, ...prev]);
    toast.success(`${files.length} document(s) uploaded to pipeline`);
    e.target.value = '';
  };

  const advanceStage = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id !== docId) return d;
        const idx = STAGES_ORDER.indexOf(d.stage);
        if (idx >= STAGES_ORDER.length - 1) return d;
        const nextStage = STAGES_ORDER[idx + 1];

        if (d.investigationOrderId) {
          const invStatus = nextStage === 'delivered' ? 'delivered' : nextStage === 'uploaded' ? 'uploaded' : 'ordered';
          updateInvestigationStatus(d.investigationOrderId, invStatus as any);
        }

        if (nextStage === 'delivered') {
          toast.success(`Report delivered: ${d.title}`, {
            description: `${d.patientName} — report is now available in follow-ups`,
            duration: 5000,
          });
        }

        return { ...d, stage: nextStage };
      }),
    );
  };

  const stageCounts = STAGES_ORDER.reduce(
    (acc, stage) => {
      acc[stage] = mergedDocuments.filter((d) => d.stage === stage).length;
      return acc;
    },
    {} as Record<PipelineStage, number>
  );

  const STAT_CARDS: { stage: PipelineStage; iconBg: string; iconColor: string; glow: string }[] = [
    { stage: 'ordered', iconBg: 'bg-blue-100 dark:bg-blue-950/50', iconColor: 'text-blue-500 dark:text-blue-400', glow: 'glow-blue' },
    { stage: 'uploaded', iconBg: 'bg-amber-100 dark:bg-amber-950/50', iconColor: 'text-amber-500 dark:text-amber-400', glow: '' },
    { stage: 'delivered', iconBg: 'bg-emerald-100 dark:bg-emerald-950/50', iconColor: 'text-emerald-500 dark:text-emerald-400', glow: 'glow-emerald' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="gradient-text">DocuStream</span>
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">Document processing pipeline · Ordered → Uploaded → Delivered</p>
        </div>
        <div>
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.png,.doc,.docx" className="hidden" onChange={handleFileChange} />
          <button onClick={handleUpload} className="btn-primary inline-flex items-center gap-2 text-sm">
            <Upload className="h-4 w-4" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-3 gap-4">
        {STAT_CARDS.map(({ stage, iconBg, iconColor, glow }) => {
          const config = STAGE_CONFIG[stage];
          const StageIcon = config.icon;
          return (
            <motion.div
              key={stage}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: STAGES_ORDER.indexOf(stage) * 0.08 }}
              className={`stat-card ${glow}`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
                  <StageIcon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{stageCounts[stage]}</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{config.label}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Flow indicator */}
      <div className="card-glass flex items-center justify-center gap-3 py-3 px-6">
        {STAGES_ORDER.map((stage, i) => (
          <div key={stage} className="flex items-center gap-3">
            <span className={`text-xs font-semibold ${STAGE_CONFIG[stage].color}`}>{STAGE_CONFIG[stage].label}</span>
            {i < STAGES_ORDER.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />}
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {STAGES_ORDER.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            documents={mergedDocuments.filter((d) => d.stage === stage)}
            onAdvance={advanceStage}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="card-glass flex flex-wrap items-center gap-4 px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">
        <span className="font-semibold text-gray-700 dark:text-gray-300">Document types:</span>
        {Object.entries(DOC_TYPE_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <span key={key} className="inline-flex items-center gap-1.5">
              <span className={`flex h-5 w-5 items-center justify-center rounded-md ${config.color} ${config.darkColor}`}>
                <Icon className="h-3 w-3" />
              </span>
              {config.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

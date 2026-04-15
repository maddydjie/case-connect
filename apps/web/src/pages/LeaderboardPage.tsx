import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Medal, Trophy, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';

type Period = 'week' | 'month' | 'all';

const ROWS: {
  rank: number;
  name: string;
  inst: string;
  acc: number;
  cases: number;
  streak: number;
  badges: number;
  self?: boolean;
}[] = [
  { rank: 1, name: 'Ananya Iyer', inst: 'AIIMS Delhi', acc: 94, cases: 412, streak: 18, badges: 12 },
  { rank: 2, name: 'Vikram Joshi', inst: 'CMC Vellore', acc: 91, cases: 389, streak: 12, badges: 10 },
  { rank: 3, name: 'Meera Krishnan', inst: 'KEM Mumbai', acc: 89, cases: 355, streak: 9, badges: 9 },
  { rank: 4, name: 'Arjun Nair', inst: 'JIPMER', acc: 87, cases: 301, streak: 7, badges: 8 },
  { rank: 5, name: 'You (Demo)', inst: 'CaseConnect', acc: 84, cases: 220, streak: 5, badges: 6, self: true },
  { rank: 6, name: 'Sana Khan', inst: 'AMU', acc: 82, cases: 198, streak: 4, badges: 5 },
];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>('month');
  const [dept, setDept] = useState<string>('all');
  const [bump, setBump] = useState(0);

  const podium = useMemo(() => ROWS.slice(0, 3), []);

  const shuffleDemo = () => {
    setBump((b) => b + 1);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Leader<span className="gradient-text">board</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Podium · filters · animated rank changes (demo)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="card-glass inline-flex rounded-full p-1">
            {(['week', 'month', 'all'] as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={clsx(
                  'rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-all duration-200',
                  period === p
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                )}
              >
                {p === 'all' ? 'All time' : p}
              </button>
            ))}
          </div>
          <select
            className="input max-w-[180px] rounded-full"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
          >
            <option value="all">All departments</option>
            <option value="cardio">Cardiology</option>
            <option value="med">General Medicine</option>
            <option value="surg">Surgery</option>
          </select>
          <button
            type="button"
            onClick={shuffleDemo}
            className="btn-secondary inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm"
          >
            <TrendingUp className="h-4 w-4" />
            Simulate rank change
          </button>
        </div>
      </div>

      {/* Podium */}
      <div className="grid grid-cols-3 gap-5 max-w-3xl mx-auto items-end">
        {[podium[1], podium[0], podium[2]].map((p, i) => {
          const heights = ['h-44', 'h-56', 'h-40'];
          const medalStyles = [
            'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-700 shadow-lg shadow-slate-400/30',
            'bg-gradient-to-br from-amber-300 to-yellow-500 text-amber-900 shadow-lg shadow-amber-400/40',
            'bg-gradient-to-br from-orange-300 to-amber-500 text-orange-900 shadow-lg shadow-orange-400/30',
          ];
          const cardStyles = [
            'border-slate-200/60 bg-gradient-to-b from-slate-50/80 to-white/90 dark:from-slate-900/40 dark:to-gray-900/80 dark:border-slate-700/40',
            'border-amber-200/60 bg-gradient-to-b from-amber-50/90 to-white/90 dark:from-amber-950/30 dark:to-gray-900/80 dark:border-amber-700/40 glow-emerald',
            'border-orange-200/60 bg-gradient-to-b from-orange-50/60 to-white/90 dark:from-orange-950/20 dark:to-gray-900/80 dark:border-orange-800/40',
          ];
          const labels = ['2nd', '1st', '3rd'];
          if (!p) return null;
          return (
            <motion.div
              key={p.rank + bump}
              layout
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18, delay: i * 0.1 }}
              className={clsx(
                'relative rounded-2xl border text-center shadow-xl backdrop-blur-sm flex flex-col justify-end overflow-hidden',
                cardStyles[i],
              )}
            >
              {i === 1 && (
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.12),transparent_70%)]" />
              )}
              <div className="relative">
                <div className={clsx('mx-auto -mt-6 flex h-16 w-16 items-center justify-center rounded-full', medalStyles[i])}>
                  {i === 1 ? <Trophy className="h-8 w-8" /> : <Medal className="h-7 w-7" />}
                </div>
                <div className={clsx('p-5 rounded-b-2xl', heights[i])}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{labels[i]}</p>
                  <p className="mt-1.5 font-bold text-gray-900 dark:text-white">{p.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{p.inst}</p>
                  <p className="mt-4 text-3xl font-black gradient-text">{p.acc}%</p>
                  <p className="text-[10px] font-medium text-gray-400">accuracy</p>
                  <p className="mt-2 text-xs text-gray-500">{p.cases} cases · {p.streak}d streak</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="table-header">
              <tr>
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Institution</th>
                <th className="px-5 py-3">Accuracy</th>
                <th className="px-5 py-3">Cases</th>
                <th className="px-5 py-3">Streak</th>
                <th className="px-5 py-3">Badges</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80 dark:divide-gray-800/80">
              <AnimatePresence>
                {ROWS.map((r) => (
                  <motion.tr
                    key={r.name}
                    layout
                    initial={false}
                    animate={{ backgroundColor: r.self ? 'rgba(16,185,129,0.06)' : 'transparent' }}
                    className={clsx(
                      'table-row',
                      r.self && 'ring-1 ring-inset ring-emerald-500/20',
                    )}
                  >
                    <td className="px-5 py-3.5">
                      <span className={clsx(
                        'inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold',
                        r.rank === 1 && 'bg-gradient-to-br from-amber-300 to-yellow-500 text-amber-900 shadow shadow-amber-300/30',
                        r.rank === 2 && 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-700',
                        r.rank === 3 && 'bg-gradient-to-br from-orange-300 to-amber-400 text-orange-900',
                        r.rank > 3 && 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
                      )}>
                        {r.rank}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900 dark:text-white">
                      {r.name}
                      {r.self && (
                        <span className="badge-emerald ml-2 text-[10px]">You</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">{r.inst}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                            style={{ width: `${r.acc}%` }}
                          />
                        </div>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{r.acc}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-700 dark:text-gray-300">{r.cases}</td>
                    <td className="px-5 py-3.5">
                      <span className="badge-amber">{r.streak}d 🔥</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="badge-violet">{r.badges}</span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

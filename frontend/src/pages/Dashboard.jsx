import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, Clock, AlertTriangle, FolderKanban, ArrowRight, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/tasks/stats/dashboard'), api.get('/tasks'), api.get('/projects')])
      .then(([s, t, p]) => { setStats(s.data); setTasks(t.data.slice(0,6)); setProjects(p.data.slice(0,4)); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#0ea5e9]" size={28} /></div>;

  const rate = stats?.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const statusColors = { 'Todo':'bg-slate-500/15 text-slate-400','In Progress':'bg-blue-500/15 text-blue-400','In Review':'bg-purple-500/15 text-purple-400','Done':'bg-green-500/15 text-green-400' };
  const priColors = { Critical:'bg-red-500/15 text-red-400 border-red-500/20',High:'bg-orange-500/15 text-orange-400 border-orange-500/20',Medium:'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',Low:'bg-slate-500/15 text-slate-400 border-slate-500/20' };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-white">Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-slate-500 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: CheckSquare, label: 'Total Tasks', value: stats?.total||0, color: 'bg-[#0ea5e9]/15 text-[#0ea5e9]', sub: `${rate}% complete` },
          { icon: Clock, label: 'In Progress', value: stats?.inProgress||0, color: 'bg-blue-500/15 text-blue-400' },
          { icon: AlertTriangle, label: 'Overdue', value: stats?.overdue||0, color: 'bg-red-500/15 text-red-400' },
          { icon: FolderKanban, label: 'Projects', value: stats?.projects||0, color: 'bg-purple-500/15 text-purple-400' },
        ].map(({ icon: Icon, label, value, color, sub }) => (
          <div key={label} className="glass-card p-5 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}><Icon size={18} /></div>
            <div><p className="text-slate-500 text-sm">{label}</p><p className="text-2xl font-display font-bold text-white mt-0.5">{value}</p>{sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}</div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-white">Recent Tasks</h2>
            <Link to="/tasks" className="text-[#0ea5e9] text-sm flex items-center gap-1">View all <ArrowRight size={14} /></Link>
          </div>
          <div className="glass-card divide-y divide-[#1e2535]">
            {tasks.length === 0 ? <div className="p-8 text-center text-slate-500">No tasks yet</div> : tasks.map(task => (
              <div key={task._id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${task.status==='Done'?'line-through text-slate-500':'text-slate-200'}`}>{task.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                    <span>{task.project?.name}</span>
                    {task.dueDate && <span className={`flex items-center gap-1 ${task.isOverdue?'text-red-400':''}`}><Calendar size={10} />{format(new Date(task.dueDate),'MMM d')}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`badge border ${priColors[task.priority]}`}>{task.priority}</span>
                  <span className={`badge ${statusColors[task.status]}`}>{task.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-white">Projects</h2>
            <Link to="/projects" className="text-[#0ea5e9] text-sm flex items-center gap-1">View all <ArrowRight size={14} /></Link>
          </div>
          <div className="space-y-3">
            {projects.map(p => {
              const prog = p.taskCount > 0 ? Math.round((p.completedCount/p.taskCount)*100) : 0;
              return (
                <Link key={p._id} to={`/projects/${p._id}`}>
                  <div className="glass-card p-4 hover:border-[#0ea5e9]/30 transition-colors cursor-pointer mb-3">
                    <div className="flex items-center gap-2 mb-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor:p.color||'#6366f1'}} /><p className="text-sm font-medium text-slate-200 truncate">{p.name}</p></div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1"><span>{p.taskCount} tasks</span><span>{prog}%</span></div>
                    <div className="h-1.5 bg-[#1a2030] rounded-full overflow-hidden"><div className="h-full bg-[#0ea5e9] rounded-full" style={{width:`${prog}%`}} /></div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
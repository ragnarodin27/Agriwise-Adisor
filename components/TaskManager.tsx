
import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Plus, Trash2, Calendar, Clock, AlertCircle, 
  ChevronDown, ClipboardList, CheckCircle, Circle, Filter, ArrowUpDown, X, ListFilter, SortAsc,
  PieChart, TrendingUp, Download, FileText, Layout
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface Task {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  completed: boolean;
  createdAt: number;
}

const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', priority: 'Medium', dueDate: '' });
  
  // Filtering & Sorting State
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'High' | 'Medium' | 'Low'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'createdAt'>('dueDate');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('agri_tasks') || '[]');
    setTasks(saved);
  }, []);

  const saveTasks = (updated: Task[]) => {
    setTasks(updated);
    localStorage.setItem('agri_tasks', JSON.stringify(updated));
  };

  const addTask = () => {
    if (!newTask.title.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      priority: newTask.priority as any,
      dueDate: newTask.dueDate || new Date().toISOString().split('T')[0],
      completed: false,
      createdAt: Date.now()
    };
    saveTasks([task, ...tasks]);
    setNewTask({ title: '', priority: 'Medium', dueDate: '' });
    setShowAdd(false);
  };

  const toggleTask = (id: string) => {
    saveTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      saveTasks(tasks.filter(t => t.id !== deleteId));
      setDeleteId(null);
    }
  };

  const formatRelativeDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    
    return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'active' && task.completed) return false;
    if (filterStatus === 'completed' && !task.completed) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (filterStatus === 'all' && a.completed !== b.completed) {
        return a.completed ? 1 : -1;
    }
    if (sortBy === 'priority') {
      const priorityMap = { High: 0, Medium: 1, Low: 2 };
      return priorityMap[a.priority] - priorityMap[b.priority];
    } else if (sortBy === 'dueDate') {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else {
      return b.createdAt - a.createdAt;
    }
  });

  const exportCSV = () => {
    const headers = "ID,Title,Priority,DueDate,Status\n";
    const rows = sortedTasks.map(t => `${t.id},"${t.title}",${t.priority},${t.dueDate},${t.completed ? 'Completed' : 'Pending'}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agriwise_tasks_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("AgriWise Farm Log Export", 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
    
    let y = 45;
    sortedTasks.forEach((t, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont(undefined, 'bold');
      doc.text(`${i + 1}. ${t.title}`, 20, y);
      doc.setFont(undefined, 'normal');
      doc.text(`Priority: ${t.priority} | Due: ${t.dueDate} | Status: ${t.completed ? 'COMPLETED' : 'PENDING'}`, 25, y + 7);
      y += 15;
    });
    doc.save(`agriwise_tasks_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const activeCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="p-4 pb-24 min-h-screen animate-in fade-in duration-500 bg-slate-50 dark:bg-[#0E1F17]">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
            <ClipboardList size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-emerald-50">Farm Log</h2>
            <p className="text-[10px] font-black text-slate-400 dark:text-emerald-500/60 uppercase tracking-widest">Daily Operations</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative group">
            <button className="h-12 w-12 bg-white dark:bg-[#1C2B22] text-slate-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shadow-soft active:scale-95 transition-all">
              <Download size={22} />
            </button>
            <div className="absolute top-full right-0 mt-2 bg-white dark:bg-[#1C2B22] rounded-2xl shadow-2xl border border-slate-100 dark:border-white/5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2 z-50 flex flex-col gap-1 min-w-[120px]">
               <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-emerald-50"><FileText size={14}/> CSV</button>
               <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-emerald-50"><Layout size={14}/> PDF</button>
            </div>
          </div>
          <button 
            onClick={() => setShowAdd(true)}
            className="h-12 w-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all hover:bg-indigo-700"
          >
            <Plus size={24} />
          </button>
        </div>
      </header>

      {/* Progress Summary */}
      <div className="mb-6 bg-white dark:bg-[#1C2B22] p-5 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 flex items-center justify-center">
               <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-100 dark:text-slate-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                  <path className="text-emerald-500 transition-all duration-1000" strokeDasharray={`${progress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
               </svg>
               <span className="absolute text-[10px] font-black text-slate-700 dark:text-white">{progress}%</span>
            </div>
            <div>
               <p className="text-xs font-bold text-slate-800 dark:text-emerald-50">{activeCount} Pending Tasks</p>
               <p className="text-[10px] font-medium text-slate-400 dark:text-emerald-500/50">{completedCount} Completed today</p>
            </div>
         </div>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-3 sticky top-0 z-20 bg-slate-50/90 dark:bg-[#0E1F17]/90 backdrop-blur-sm py-2 -mx-4 px-4">
        {/* Status Tabs */}
        <div className="bg-white dark:bg-[#1C2B22] p-1.5 rounded-2xl flex border border-slate-100 dark:border-white/5 shadow-sm">
            {['all', 'active', 'completed'].map((status) => (
                <button
                    key={status}
                    onClick={() => setFilterStatus(status as any)}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        filterStatus === status 
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                >
                    {status}
                </button>
            ))}
        </div>

        {/* Filters & Sort */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <div className="relative shrink-0">
                <select 
                    value={filterPriority} 
                    onChange={(e) => setFilterPriority(e.target.value as any)}
                    className="appearance-none pl-9 pr-8 py-3 bg-white dark:bg-[#1C2B22] border border-slate-200 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-emerald-50 outline-none focus:border-indigo-500 shadow-sm"
                >
                    <option value="all">All Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                </select>
                <Filter size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative shrink-0">
                <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="appearance-none pl-9 pr-8 py-3 bg-white dark:bg-[#1C2B22] border border-slate-200 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-emerald-50 outline-none focus:border-indigo-500 shadow-sm"
                >
                    <option value="dueDate">Sort: Due Date</option>
                    <option value="priority">Sort: Priority</option>
                    <option value="createdAt">Sort: Added</option>
                </select>
                <ArrowUpDown size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
        </div>
      </div>

      <div className="space-y-3 pb-20">
        {sortedTasks.length > 0 ? sortedTasks.map(task => {
          const isOverdue = !task.completed && new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0));
          const relativeDate = formatRelativeDate(task.dueDate);
          
          return (
            <div 
              key={task.id} 
              className={`group p-5 rounded-[2rem] border transition-all duration-300 flex items-start gap-4 ${
                task.completed 
                  ? 'bg-slate-50 dark:bg-[#1C2B22]/50 border-transparent opacity-60' 
                  : 'bg-white dark:bg-[#1C2B22] border-slate-100 dark:border-white/5 shadow-soft hover:scale-[1.01]'
              }`}
            >
              <button 
                onClick={() => toggleTask(task.id)}
                className={`mt-1 h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                  task.completed ? 'bg-indigo-600 text-white scale-110' : 'border-2 border-slate-200 dark:border-white/20 text-transparent hover:border-indigo-400'
                }`}
              >
                <CheckCircle size={14} fill={task.completed ? "white" : "none"} stroke={task.completed ? "indigo" : "currentColor"} strokeWidth={3} />
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <h4 className={`text-sm font-bold dark:text-slate-100 truncate pr-2 ${task.completed ? 'line-through text-slate-400 decoration-2 decoration-slate-300' : 'text-slate-800'}`}>
                        {task.title}
                    </h4>
                    <span className={`shrink-0 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                    task.priority === 'High' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 
                    task.priority === 'Medium' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 
                    'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    }`}>
                    {task.priority}
                    </span>
                </div>
                
                <div className="flex items-center gap-3 mt-2">
                  <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md ${
                      isOverdue 
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                        : 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                  }`}>
                    <Calendar size={10} />
                    <span>{relativeDate}</span>
                  </div>
                  {isOverdue && <span className="text-[9px] font-black text-red-500 uppercase tracking-wider flex items-center gap-1"><AlertCircle size={10}/> Overdue</span>}
                </div>
              </div>

              <button onClick={() => handleDeleteClick(task.id)} className="mt-1 text-slate-300 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20">
                <Trash2 size={16} />
              </button>
            </div>
          );
        }) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1C2B22] rounded-[2.5rem] border border-slate-100 dark:border-white/5 border-dashed">
            <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-full mb-4">
                <CheckSquare size={32} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h4 className="font-bold text-slate-400 dark:text-slate-500">No tasks found</h4>
            <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1 uppercase tracking-widest">Adjust filters or add new</p>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1C2B22] w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-900 dark:text-emerald-50">New Task</h3>
                <button onClick={() => setShowAdd(false)} className="bg-slate-100 dark:bg-white/10 p-2 rounded-full text-slate-500 hover:text-slate-800 transition-colors"><X size={18}/></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Task Title</label>
                  <input 
                    type="text" 
                    value={newTask.title}
                    onChange={e => setNewTask({...newTask, title: e.target.value})}
                    placeholder="e.g. Irrigate North Field"
                    className="w-full p-4 bg-slate-50 dark:bg-[#0E1F17] border border-slate-100 dark:border-white/10 rounded-2xl font-bold text-sm text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-all"
                    autoFocus
                  />
              </div>
              
              <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Priority Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Low', 'Medium', 'High'].map(p => (
                    <button 
                        key={p}
                        onClick={() => setNewTask({...newTask, priority: p as any})}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${
                        newTask.priority === p 
                            ? p === 'High' ? 'border-red-500 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                            : p === 'Medium' ? 'border-amber-500 bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#0E1F17] text-slate-400'
                        }`}
                    >
                        {p}
                    </button>
                    ))}
                  </div>
              </div>

              <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Due Date</label>
                  <input 
                    type="date" 
                    value={newTask.dueDate}
                    onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                    className="w-full p-4 bg-slate-50 dark:bg-[#0E1F17] border border-slate-100 dark:border-white/10 rounded-2xl font-bold text-sm text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-all"
                  />
              </div>
            </div>
            <button onClick={addTask} disabled={!newTask.title} className="w-full mt-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-indigo-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100">
                Confirm Task
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#1C2B22] w-full max-w-xs rounded-[2.5rem] p-6 shadow-2xl text-center border border-white/10">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <Trash2 size={28} />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Delete Task?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium leading-relaxed">This action cannot be undone. Are you sure you want to remove this from your log?</p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-slate-200">Cancel</button>
                    <button onClick={confirmDelete} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/30 active:scale-95 transition-all">Delete</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;

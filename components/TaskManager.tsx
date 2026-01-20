
import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Plus, Trash2, Calendar, Clock, AlertCircle, 
  ChevronDown, ClipboardList, CheckCircle, Circle, Filter, ArrowUpDown, X, ListFilter, SortAsc
} from 'lucide-react';

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

  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'active' && task.completed) return false;
    if (filterStatus === 'completed' && !task.completed) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Completed tasks always at the bottom unless filtering specifically for them
    if (filterStatus === 'all' && a.completed !== b.completed) {
        return a.completed ? 1 : -1;
    }

    if (sortBy === 'priority') {
      const priorityMap = { High: 0, Medium: 1, Low: 2 };
      return priorityMap[a.priority] - priorityMap[b.priority];
    } else if (sortBy === 'dueDate') {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else {
      // createdAt - newest first
      return b.createdAt - a.createdAt;
    }
  });

  return (
    <div className="p-4 pb-24 min-h-screen animate-in fade-in duration-500">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
            <ClipboardList size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Farm Log</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Task Management</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="h-11 w-11 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </header>

      {/* Controls */}
      <div className="mb-6 space-y-3">
        {/* Status Tabs */}
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex">
            {['all', 'active', 'completed'].map((status) => (
                <button
                    key={status}
                    onClick={() => setFilterStatus(status as any)}
                    className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${
                        filterStatus === status 
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                >
                    {status}
                </button>
            ))}
        </div>

        {/* Filters & Sort */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <div className="relative">
                <select 
                    value={filterPriority} 
                    onChange={(e) => setFilterPriority(e.target.value as any)}
                    className="appearance-none pl-8 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 outline-none focus:border-indigo-500"
                >
                    <option value="all">All Priorities</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>
                <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative">
                <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="appearance-none pl-8 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 outline-none focus:border-indigo-500"
                >
                    <option value="dueDate">Due Date</option>
                    <option value="priority">Priority</option>
                    <option value="createdAt">Date Added</option>
                </select>
                <ArrowUpDown size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
        </div>
      </div>

      <div className="space-y-4">
        {sortedTasks.length > 0 ? sortedTasks.map(task => (
          <div 
            key={task.id} 
            className={`p-5 rounded-[2rem] border transition-all flex items-center gap-4 ${
              task.completed 
                ? 'bg-slate-50 dark:bg-slate-800/50 border-transparent opacity-60' 
                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm'
            }`}
          >
            <button 
              onClick={() => toggleTask(task.id)}
              className={`h-7 w-7 rounded-full flex items-center justify-center transition-all ${
                task.completed ? 'bg-indigo-600 text-white' : 'border-2 border-slate-200 dark:border-slate-600 text-transparent'
              }`}
            >
              <CheckCircle size={18} fill={task.completed ? "white" : "none"} stroke={task.completed ? "indigo" : "currentColor"} />
            </button>
            
            <div className="flex-1">
              <h4 className={`text-sm font-bold dark:text-slate-100 ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                {task.title}
              </h4>
              <div className="flex items-center gap-3 mt-1.5">
                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                  task.priority === 'High' ? 'bg-red-50 text-red-600' : 
                  task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 
                  'bg-blue-50 text-blue-600'
                }`}>
                  {task.priority}
                </span>
                <div className={`flex items-center gap-1 text-[9px] font-bold ${
                    new Date(task.dueDate) < new Date() && !task.completed ? 'text-red-500' : 'text-slate-400'
                }`}>
                  <Calendar size={10} />
                  <span>{new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            </div>

            <button onClick={() => handleDeleteClick(task.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
              <Trash2 size={18} />
            </button>
          </div>
        )) : (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700">
            <CheckSquare size={48} className="mx-auto text-slate-100 dark:text-slate-700 mb-4" />
            <h4 className="font-bold text-slate-400 dark:text-slate-500">No tasks found</h4>
            <p className="text-xs text-slate-300 mt-1">Try changing filters or add a new task</p>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[3rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">New Task</h3>
                <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <input 
                type="text" 
                value={newTask.title}
                onChange={e => setNewTask({...newTask, title: e.target.value})}
                placeholder="What needs to be done?"
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block px-1">Priority</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Low', 'Medium', 'High'].map(p => (
                    <button 
                        key={p}
                        onClick={() => setNewTask({...newTask, priority: p as any})}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
                        newTask.priority === p 
                            ? 'bg-indigo-600 text-white shadow-lg' 
                            : 'bg-slate-50 dark:bg-slate-700 text-slate-400'
                        }`}
                    >
                        {p}
                    </button>
                    ))}
                  </div>
              </div>
              <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block px-1">Due Date</label>
                  <input 
                    type="date" 
                    value={newTask.dueDate}
                    onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={addTask} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Log Task</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[3rem] p-8 shadow-2xl text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Delete Task?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium">This action cannot be undone. Are you sure you want to remove this task?</p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteId(null)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Cancel</button>
                    <button onClick={confirmDelete} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-900/20 active:scale-95 transition-all">Yes, Delete</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;


import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Plus, Trash2, Calendar, Clock, AlertCircle, 
  ChevronLeft, ClipboardList, CheckCircle, Circle
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

  const deleteTask = (id: string) => {
    saveTasks(tasks.filter(t => t.id !== id));
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const priorityMap = { High: 0, Medium: 1, Low: 2 };
    return priorityMap[a.priority] - priorityMap[b.priority];
  });

  return (
    <div className="p-4 pb-24 min-h-screen animate-in fade-in duration-500">
      <header className="mb-8 flex items-center justify-between">
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
                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                  <Calendar size={10} />
                  <span>{new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            </div>

            <button onClick={() => deleteTask(task.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
              <Trash2 size={18} />
            </button>
          </div>
        )) : (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700">
            <CheckSquare size={48} className="mx-auto text-slate-100 dark:text-slate-700 mb-4" />
            <h4 className="font-bold text-slate-400 dark:text-slate-500">Your log is clear</h4>
            <p className="text-xs text-slate-300 mt-1">Tap + to add your first farming task</p>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[3rem] p-8 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">New Task</h3>
            <div className="space-y-4">
              <input 
                type="text" 
                value={newTask.title}
                onChange={e => setNewTask({...newTask, title: e.target.value})}
                placeholder="What needs to be done?"
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-800 dark:text-white outline-none"
              />
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
              <input 
                type="date" 
                value={newTask.dueDate}
                onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-800 dark:text-white outline-none"
              />
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-4 bg-slate-50 dark:bg-slate-700 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Cancel</button>
              <button onClick={addTask} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Log Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;

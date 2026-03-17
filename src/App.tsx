import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Lock, 
  Unlock, 
  Tag, 
  Calendar,
  X,
  Check,
  ChevronRight,
  MoreVertical,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Note, Category, CATEGORIES } from './types';

// --- Components ---

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '',
  disabled = false,
  type = 'button'
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; 
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) => {
  const variants = {
    primary: 'bg-zinc-900 text-white hover:bg-zinc-800',
    secondary: 'bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    ghost: 'bg-transparent text-zinc-600 hover:bg-zinc-100'
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ 
  value, 
  onChange, 
  placeholder, 
  type = 'text',
  className = ''
}: { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  placeholder?: string;
  type?: string;
  className?: string;
}) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full px-4 py-2 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-all ${className}`}
  />
);

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="px-6 py-4 border-bottom border-zinc-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  
  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  
  // Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [noteToUnlock, setNoteToUnlock] = useState<Note | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Load notes on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('smart_notes');
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error('Failed to parse notes', e);
      }
    }
  }, []);

  // Save notes on change
  useEffect(() => {
    localStorage.setItem('smart_notes', JSON.stringify(notes));
  }, [notes]);

  const handleSaveNote = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const category = formData.get('category') as Category;
    const isLocked = formData.get('isLocked') === 'on';
    const password = formData.get('password') as string;

    if (!title.trim()) return;

    if (editingNote) {
      setNotes(prev => prev.map(n => n.id === editingNote.id ? {
        ...n,
        title,
        content,
        category,
        isLocked,
        password: isLocked ? (password || n.password) : undefined,
        updatedAt: Date.now()
      } : n));
    } else {
      const newNote: Note = {
        id: crypto.randomUUID(),
        title,
        content,
        category,
        isLocked,
        password: isLocked ? password : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setNotes(prev => [newNote, ...prev]);
    }

    setIsEditorOpen(false);
    setEditingNote(null);
  };

  // Delete Confirmation State
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const handleDeleteNote = () => {
    if (noteToDelete) {
      setNotes(prev => prev.filter(n => n.id !== noteToDelete));
      setNoteToDelete(null);
    }
  };

  const handleUnlockNote = () => {
    if (noteToUnlock && passwordInput === noteToUnlock.password) {
      setEditingNote(noteToUnlock);
      setIsEditorOpen(true);
      setIsPasswordModalOpen(false);
      setNoteToUnlock(null);
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password');
    }
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || note.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-200 px-4 py-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white">
              <Edit3 size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">Smart Notes</h1>
          </div>
          
          <div className="flex items-center gap-2 flex-1 sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-100 border-none rounded-xl focus:ring-2 focus:ring-zinc-900/10 transition-all text-sm"
              />
            </div>
            <Button onClick={() => { setEditingNote(null); setIsEditorOpen(true); }} className="sm:w-auto">
              <Plus size={18} />
              <span className="hidden sm:inline">New Note</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6">
        {/* Categories Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar mb-6">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === 'All' 
                ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/20' 
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            All Notes
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat 
                  ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/20' 
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredNotes.map(note => (
              <motion.div
                layout
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group bg-white border border-zinc-200 rounded-2xl p-5 hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-200/50 transition-all cursor-pointer relative flex flex-col h-full"
                onClick={() => {
                  if (note.isLocked) {
                    setNoteToUnlock(note);
                    setIsPasswordModalOpen(true);
                  } else {
                    setEditingNote(note);
                    setIsEditorOpen(true);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
                    {note.category}
                  </span>
                  <div className="flex items-center gap-1">
                    {note.isLocked && <Lock size={14} className="text-zinc-400" />}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setNoteToDelete(note.id);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 hover:rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-zinc-900 mb-2 line-clamp-1">
                  {note.isLocked ? 'Locked Note' : note.title}
                </h3>
                
                <p className="text-sm text-zinc-500 line-clamp-3 mb-4 flex-grow">
                  {note.isLocked ? 'Enter password to view content...' : note.content}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-50 mt-auto">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Calendar size={12} />
                    <span className="text-[11px] font-medium">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-zinc-300 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredNotes.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-400">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                <Search size={24} />
              </div>
              <p className="text-sm font-medium">No notes found</p>
              <p className="text-xs">Try adjusting your search or category filter</p>
            </div>
          )}
        </div>
      </main>

      {/* Editor Modal */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <form onSubmit={handleSaveNote} className="flex flex-col h-full">
                <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                  <h3 className="text-lg font-bold text-zinc-900">
                    {editingNote ? 'Edit Note' : 'Create New Note'}
                  </h3>
                  <button 
                    type="button"
                    onClick={() => { setIsEditorOpen(false); setEditingNote(null); }} 
                    className="p-2 hover:bg-zinc-200 rounded-full transition-colors"
                  >
                    <X size={20} className="text-zinc-500" />
                  </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto flex-grow">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Title</label>
                    <input 
                      name="title"
                      defaultValue={editingNote?.title}
                      placeholder="Note title..."
                      autoFocus
                      className="w-full text-2xl font-bold text-zinc-900 border-none focus:ring-0 placeholder:text-zinc-300 p-0"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 py-2">
                    <div className="flex items-center gap-2">
                      <Tag size={16} className="text-zinc-400" />
                      <select 
                        name="category"
                        defaultValue={editingNote?.category || 'General'}
                        className="bg-zinc-100 border-none rounded-lg text-sm font-medium text-zinc-600 focus:ring-2 focus:ring-zinc-900/10 py-1 px-3"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            name="isLocked"
                            defaultChecked={editingNote?.isLocked}
                            className="sr-only peer"
                            onChange={(e) => {
                              const passInput = document.getElementById('note-password-input');
                              if (passInput) passInput.style.display = e.target.checked ? 'block' : 'none';
                            }}
                          />
                          <div className="w-10 h-5 bg-zinc-200 rounded-full peer peer-checked:bg-zinc-900 transition-all"></div>
                          <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5 shadow-sm"></div>
                        </div>
                        <span className="text-sm font-medium text-zinc-600 flex items-center gap-1.5">
                          <Lock size={14} />
                          Password Lock
                        </span>
                      </label>
                    </div>
                  </div>

                  <div 
                    id="note-password-input" 
                    style={{ display: editingNote?.isLocked ? 'block' : 'none' }}
                    className="space-y-1"
                  >
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Set Password</label>
                    <input 
                      type="password"
                      name="password"
                      placeholder="Enter a secret password..."
                      className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900/10 transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-1 flex-grow flex flex-col min-h-[200px]">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Content</label>
                    <textarea 
                      name="content"
                      defaultValue={editingNote?.content}
                      placeholder="Start writing your thoughts..."
                      className="w-full flex-grow text-zinc-700 border-none focus:ring-0 placeholder:text-zinc-300 p-0 resize-none leading-relaxed"
                    />
                  </div>
                </div>

                <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-3">
                  <Button 
                    variant="ghost" 
                    onClick={() => { setIsEditorOpen(false); setEditingNote(null); }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Check size={18} />
                    Save Note
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Unlock Modal */}
      <Modal 
        isOpen={isPasswordModalOpen} 
        onClose={() => { setIsPasswordModalOpen(false); setNoteToUnlock(null); setPasswordInput(''); setPasswordError(''); }}
        title="Protected Note"
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4 text-zinc-900">
              <Shield size={32} />
            </div>
            <p className="text-sm text-zinc-600">This note is encrypted. Please enter the password to view its content.</p>
          </div>
          
          <div className="space-y-2">
            <Input 
              type="password"
              placeholder="Enter password..."
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(''); }}
              className={passwordError ? 'border-red-500 focus:ring-red-500/10' : ''}
            />
            {passwordError && <p className="text-xs text-red-500 font-medium ml-1">{passwordError}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              variant="ghost" 
              className="flex-1"
              onClick={() => { setIsPasswordModalOpen(false); setNoteToUnlock(null); setPasswordInput(''); }}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1"
              onClick={handleUnlockNote}
            >
              <Unlock size={18} />
              Unlock
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        title="Delete Note"
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
              <Trash2 size={32} />
            </div>
            <p className="text-sm text-zinc-600">Are you sure you want to delete this note? This action cannot be undone.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button 
              variant="ghost" 
              className="flex-1"
              onClick={() => setNoteToDelete(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="danger"
              className="flex-1"
              onClick={handleDeleteNote}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-6 right-6 sm:hidden">
        <button
          onClick={() => { setEditingNote(null); setIsEditorOpen(true); }}
          className="w-14 h-14 bg-zinc-900 text-white rounded-full shadow-2xl shadow-zinc-900/40 flex items-center justify-center active:scale-95 transition-transform"
        >
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
}

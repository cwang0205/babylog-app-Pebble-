
import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { AuthService } from './services/authService';
import { StorageService } from './services/storageService';
import { GeminiService } from './services/geminiService';
import { BabyEvent, BabyProfile, Gender, ParseResult } from './types';
import VoiceRecorder from './components/VoiceRecorder';
import EventList from './components/EventList';
import Dashboard, { FilterCategory } from './components/Dashboard';
import ConsolidatedReport from './components/ConsolidatedReport';
import EventConfirmation from './components/EventConfirmation';
import DayCalendarView from './components/DayCalendarView';
import TutorialOverlay from './components/TutorialOverlay';
import { PlusIcon, SendIcon, CalendarIcon, ListBulletIcon, ChevronLeftIcon, ChevronRightIcon, ChartBarIcon } from './components/Icons';

type ViewMode = 'list' | 'calendar' | 'report';

function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // App State
  const [babies, setBabies] = useState<BabyProfile[]>([]);
  const [currentBaby, setCurrentBaby] = useState<BabyProfile | null>(null);
  const [events, setEvents] = useState<BabyEvent[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterCategory, setFilterCategory] = useState<FilterCategory>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [pendingEvent, setPendingEvent] = useState<ParseResult | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [showAddBaby, setShowAddBaby] = useState(false);
  
  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Onboarding Form State
  const [newBabyName, setNewBabyName] = useState('');
  const [newBabyDate, setNewBabyDate] = useState(new Date().toISOString().split('T')[0]);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = AuthService.onUserChange((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Load Babies when User Logs In
  useEffect(() => {
    if (user) {
      loadBabies();
      checkTutorialStatus(user.uid);
    } else {
      setBabies([]);
      setCurrentBaby(null);
      setEvents([]);
    }
  }, [user]);

  // 3. Load Events when Baby Selected
  useEffect(() => {
    if (currentBaby) {
      loadEvents(currentBaby.id);
      setFilterCategory(null);
    }
  }, [currentBaby]);

  const checkTutorialStatus = (userId: string) => {
    const key = `babylog:tutorial_seen:${userId}`;
    const hasSeen = localStorage.getItem(key);
    if (!hasSeen) {
      // Don't show immediately if they need to create a baby profile first (onboarding)
      // We will trigger it after profile creation or if profile exists.
      // Logic handled in loadBabies or handleAddBaby
    }
  };

  const loadBabies = async () => {
    if (!user) return;
    const loadedBabies = await StorageService.getBabies(user.uid);
    setBabies(loadedBabies);
    
    if (loadedBabies.length > 0) {
      setCurrentBaby(loadedBabies[0]);
      // If user has babies, check tutorial
      const key = `babylog:tutorial_seen:${user.uid}`;
      if (!localStorage.getItem(key)) {
        setShowTutorial(true);
      }
    } else {
      setShowAddBaby(true);
    }
  };

  const loadEvents = async (babyId: string) => {
    const babyEvents = await StorageService.getEvents(babyId);
    setEvents(babyEvents);
  };

  const handleAddBaby = async () => {
    if (!newBabyName.trim() || !newBabyDate || !user) return;
    
    const newBabyData = {
      name: newBabyName,
      birthDate: new Date(newBabyDate).toISOString(),
      gender: Gender.BOY // Defaulting for simplicity
    };

    const createdBaby = await StorageService.saveBaby(user.uid, newBabyData);
    
    setBabies([...babies, createdBaby]);
    setCurrentBaby(createdBaby);
    setShowAddBaby(false);
    setNewBabyName('');
    setNewBabyDate(new Date().toISOString().split('T')[0]);
    
    // Show tutorial after first baby created
    const key = `babylog:tutorial_seen:${user.uid}`;
    if (!localStorage.getItem(key)) {
      setShowTutorial(true);
    }
  };

  const closeTutorial = () => {
    if (user) {
      const key = `babylog:tutorial_seen:${user.uid}`;
      localStorage.setItem(key, 'true');
    }
    setShowTutorial(false);
  };

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const processInput = async (text?: string, audioBlob?: Blob) => {
    setIsProcessing(true);
    try {
      let result: ParseResult;
      
      if (audioBlob) {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        const base64Audio = await new Promise<string>((resolve) => {
           reader.onloadend = () => {
             const base64String = (reader.result as string).split(',')[1];
             resolve(base64String);
           };
        });
        
        result = await GeminiService.parseInput({ 
          audioBase64: base64Audio, 
          mimeType: audioBlob.type 
        });
      } else if (text) {
        result = await GeminiService.parseInput({ text });
      } else {
        throw new Error("No input provided");
      }

      setPendingEvent(result);
    } catch (error) {
      console.error("Processing failed", error);
      alert("We couldn't quite catch that. Please try again.");
    } finally {
      setIsProcessing(false);
      setTextInput('');
    }
  };

  const handleEditEvent = (event: BabyEvent) => {
    setEditingEventId(event.id);
    setPendingEvent(event);
  };

  const cancelEdit = () => {
    setPendingEvent(null);
    setEditingEventId(null);
  };

  const saveEvent = async (data: ParseResult) => {
    if (!currentBaby) return;
    
    if (editingEventId) {
      // Update Existing Event
      const updatedEvent: BabyEvent = {
        ...data as BabyEvent,
        id: editingEventId,
        babyId: currentBaby.id,
        createdAt: events.find(e => e.id === editingEventId)?.createdAt || new Date().toISOString()
      };
      await StorageService.updateEvent(updatedEvent);
    } else {
      // Create New Event
      const { id, ...cleanData } = data as any;
      const newEventData = {
        babyId: currentBaby.id,
        createdAt: new Date().toISOString(),
        ...cleanData
      };
      await StorageService.addEvent(newEventData);
    }
    
    setPendingEvent(null);
    setEditingEventId(null);
    loadEvents(currentBaby.id);
  };

  const calculateAge = (birthDateStr: string) => {
    const birth = new Date(birthDateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - birth.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Newborn';
    if (diffDays < 30) return `${diffDays} days old`;
    
    const months = Math.floor(diffDays / 30.44);
    const remainingDays = Math.floor(diffDays % 30.44);
    
    if (months < 12) {
      return `${months}m ${remainingDays}d old`;
    }
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return `${years}y ${remainingMonths}m old`;
  };

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    
    try {
      await AuthService.signInWithGoogle();
    } catch (error: any) {
      console.error("Login failed", error);
      alert("Sign in failed. Check console for details.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // --- RENDERING ---

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-rust/30 border-t-rust rounded-full animate-spin"></div>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 relative">
        
        <div className="text-center space-y-6 max-w-sm w-full animate-fade-in-up">
           <div className="w-20 h-20 bg-rust rounded-full flex items-center justify-center text-white font-serif font-bold italic text-4xl mx-auto shadow-xl shadow-rust/30">
             B
           </div>
           <div>
             <h1 className="text-4xl font-serif font-bold text-charcoal">BabyLog</h1>
             <p className="text-charcoal/60 mt-2 text-lg">Voice-first tracking for modern parents.</p>
           </div>
           
           {/* Login Button */}
           <div className="pt-8">
             <button 
               onClick={handleLogin}
               disabled={isLoggingIn}
               className={`w-full flex items-center justify-center gap-3 bg-white border border-subtle p-4 rounded-xl shadow-sm hover:shadow-md transition-all font-bold text-charcoal group ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
               {isLoggingIn ? (
                 <div className="w-6 h-6 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin"></div>
               ) : (
                 <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="G" />
               )}
               <span className="group-hover:text-rust transition-colors">
                 {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
               </span>
             </button>
             <p className="text-xs text-charcoal/40 mt-4">Your data is securely stored in the cloud.</p>
           </div>
        </div>
      </div>
    );
  }

  // ONBOARDING SCREEN
  if (showAddBaby) {
    return (
      <div className="min-h-screen bg-cream flex flex-col justify-center items-center px-6 animate-fade-in-up">
        <div className="w-full max-w-md bg-surface p-8 rounded-3xl shadow-xl border border-subtle text-center">
          <div className="w-16 h-16 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">👶</div>
          <h1 className="text-3xl font-serif font-bold text-charcoal mb-2">Welcome!</h1>
          <p className="text-charcoal/70 mb-8 font-sans">Let's create a profile for your little one.</p>
          
          <div className="text-left mb-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-charcoal/60 uppercase tracking-wider mb-2">Baby's Name</label>
              <input
                className="w-full p-4 rounded-xl bg-subtle border-none text-lg font-serif focus:ring-2 focus:ring-rust outline-none transition-all"
                placeholder="e.g. Leo"
                value={newBabyName}
                onChange={(e) => setNewBabyName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-charcoal/60 uppercase tracking-wider mb-2">Birth Date</label>
              <input
                type="date"
                className="w-full p-4 rounded-xl bg-subtle border-none text-lg font-sans focus:ring-2 focus:ring-rust outline-none transition-all text-charcoal"
                value={newBabyDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setNewBabyDate(e.target.value)}
              />
            </div>
          </div>
          
          <button 
            onClick={handleAddBaby}
            className="w-full py-4 bg-rust text-white rounded-xl font-bold text-lg shadow-lg shadow-rust/30 hover:shadow-xl hover:bg-rust/90 transition-all transform hover:-translate-y-0.5"
          >
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  // MAIN APP
  return (
    <div className="min-h-screen bg-cream flex flex-col relative">
      
      {/* 1. Header & Hero */}
      <div className="bg-cream px-6 pt-8 pb-4 max-w-5xl mx-auto w-full">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-rust rounded-full flex items-center justify-center text-white font-serif font-bold italic">B</span>
            <span className="font-serif font-bold text-xl text-charcoal">BabyLog</span>
          </div>
          
          {/* Profile Switcher & Logout */}
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
              {babies.map(b => (
                <button 
                  key={b.id}
                  onClick={() => setCurrentBaby(b)}
                  className={`
                    flex items-center gap-2 px-3 py-1 rounded-full transition-all border
                    ${currentBaby?.id === b.id 
                      ? 'bg-charcoal text-white border-charcoal shadow-sm' 
                      : 'bg-white text-charcoal/70 border-subtle hover:border-sage'}
                  `}
                >
                  <span className="text-xs font-bold">{b.name}</span>
                </button>
              ))}
              <button 
                onClick={() => {
                  setShowAddBaby(true);
                  setNewBabyName('');
                  setNewBabyDate(new Date().toISOString().split('T')[0]);
                }}
                className="w-8 h-8 rounded-full bg-white border border-dashed border-charcoal/30 flex items-center justify-center text-charcoal/50 hover:bg-subtle hover:text-charcoal transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
            
            <div className="h-6 w-[1px] bg-charcoal/10 mx-1"></div>
            
            <button 
              onClick={() => AuthService.signOut()}
              className="text-xs font-bold text-charcoal/50 hover:text-rust underline"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Hero & Date Navigation */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in-up">
          <div>
             <h1 className="text-3xl md:text-4xl font-serif text-charcoal">
               Daily Overview
             </h1>
             <div className="flex items-center gap-2 text-charcoal/60 mt-1">
               <span className="font-bold">{currentBaby?.name}</span>
               <span>•</span>
               <span>{currentBaby ? calculateAge(currentBaby.birthDate) : ''}</span>
             </div>
          </div>

          {/* Date Navigator */}
          <div className="flex items-center bg-white rounded-xl border border-subtle shadow-sm p-1">
             <button onClick={() => handleDateChange(-1)} className="p-2 hover:bg-subtle rounded-lg text-charcoal/60">
                <ChevronLeftIcon className="w-5 h-5" />
             </button>
             <div className="px-4 py-2 min-w-[140px] text-center">
                <span className="block text-xs font-bold uppercase text-charcoal/40 tracking-wider">Viewing</span>
                <span className="block font-serif font-bold text-charcoal">
                  {selectedDate.toDateString() === new Date().toDateString() ? 'Today' : selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
             </div>
             <button onClick={() => handleDateChange(1)} className="p-2 hover:bg-subtle rounded-lg text-charcoal/60">
                <ChevronRightIcon className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>

      {/* 2. Main Grid Layout */}
      <main className="flex-1 px-4 md:px-6 pb-32 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Top: Quick Stats */}
        <div className="md:col-span-12 animate-fade-in-up stagger-1">
          <Dashboard 
            events={events} 
            selectedDate={selectedDate} 
            activeFilter={filterCategory}
            onFilterSelect={setFilterCategory}
          />
        </div>

        {/* Bottom: Tabs & Detailed View */}
        <div className="md:col-span-12 animate-fade-in-up stagger-2">
           <div className="flex items-center justify-between mb-4 mt-4">
             <div className="flex items-baseline gap-3">
               <h2 className="font-serif text-xl text-charcoal">
                 {viewMode === 'list' ? 'Timeline' : viewMode === 'calendar' ? 'Schedule' : 'Analysis'}
               </h2>
               {filterCategory && (
                 <span className="text-xs font-bold uppercase bg-charcoal text-white px-2 py-1 rounded-md flex items-center gap-1 animate-fade-in-up">
                    Filtered by {filterCategory}
                    <button onClick={() => setFilterCategory(null)} className="ml-1 hover:text-rust">×</button>
                 </span>
               )}
             </div>
             
             {/* View Toggles */}
             <div className="flex bg-white rounded-lg p-1 border border-subtle shadow-sm">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-charcoal text-white' : 'text-charcoal/50 hover:bg-subtle'}`}
                  title="List View"
                >
                  <ListBulletIcon className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setViewMode('calendar')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-charcoal text-white' : 'text-charcoal/50 hover:bg-subtle'}`}
                  title="Calendar View"
                >
                  <CalendarIcon className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setViewMode('report')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'report' ? 'bg-charcoal text-white' : 'text-charcoal/50 hover:bg-subtle'}`}
                  title="Report View"
                >
                  <ChartBarIcon className="w-5 h-5" />
                </button>
             </div>
           </div>

           {/* View Switching */}
           {viewMode === 'list' && (
             <EventList 
                events={events} 
                selectedDate={selectedDate} 
                filterCategory={filterCategory}
                onEditEvent={handleEditEvent}
             />
           )}
           
           {viewMode === 'calendar' && (
             <DayCalendarView 
                events={events} 
                selectedDate={selectedDate}
                filterCategory={filterCategory}
             />
           )}
           
           {viewMode === 'report' && (
             <ConsolidatedReport events={events} selectedDate={selectedDate} />
           )}
        </div>

      </main>

      {/* 3. Sticky Footer / Voice Input */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-cream via-cream to-transparent pointer-events-none z-20">
        <div className="max-w-xl mx-auto flex flex-col items-center pointer-events-auto">
          
          {/* Voice Button (Floating) */}
          <div className="mb-4">
            <VoiceRecorder 
              onRecordingComplete={(blob) => processInput(undefined, blob)} 
              isProcessing={isProcessing} 
            />
          </div>

          {/* Text Input (Pill) */}
          <div className="w-full bg-surface shadow-2xl shadow-charcoal/10 rounded-full p-2 pl-6 flex items-center gap-2 border border-subtle transition-all focus-within:ring-2 focus-within:ring-rust/20">
            <input 
              type="text" 
              placeholder="Or type manual log (e.g. 'Jane ate 4oz')..."
              className="flex-1 bg-transparent border-none text-charcoal placeholder-charcoal/40 text-sm focus:outline-none font-sans"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && textInput && processInput(textInput)}
              disabled={isProcessing}
            />
            <button 
              onClick={() => textInput && processInput(textInput)}
              disabled={!textInput || isProcessing}
              className="bg-charcoal text-white p-3 rounded-full hover:bg-rust transition-colors disabled:opacity-50"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>

      {/* Modals */}
      {showTutorial && (
        <TutorialOverlay 
          onClose={closeTutorial} 
          userName={user.displayName?.split(' ')[0]} 
        />
      )}

      {pendingEvent && (
        <EventConfirmation 
          data={pendingEvent} 
          mode={editingEventId ? 'edit' : 'create'}
          onConfirm={saveEvent} 
          onCancel={cancelEdit} 
        />
      )}
    </div>
  );
}

export default App;

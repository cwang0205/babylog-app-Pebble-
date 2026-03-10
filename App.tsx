
import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { AuthService } from './services/authService';
import { StorageService } from './services/storageService';
import { GeminiService } from './services/geminiService';
import { BabyEvent, BabyProfile, Gender, ParseResult, EventType } from './types';
import VoiceRecorder from './components/VoiceRecorder';
import EventList from './components/EventList';
import Dashboard, { FilterCategory } from './components/Dashboard';
import ConsolidatedReport from './components/ConsolidatedReport';
import EventConfirmation from './components/EventConfirmation';
import DayCalendarView from './components/DayCalendarView';
import TutorialOverlay from './components/TutorialOverlay';
import ShareBabyModal from './components/ShareBabyModal';
import MilestoneView from './components/MilestoneView';
import { PlusIcon, CalendarIcon, ListBulletIcon, ChevronLeftIcon, ChevronRightIcon, ChartBarIcon, UserPlusIcon, FeedIcon, MoonIcon, DiaperIcon, SparklesIcon } from './components/Icons';
import { generateSeedData } from './utils/seedData';

type ViewMode = 'list' | 'calendar' | 'report';

// Helper Component for Quick Action Buttons
const QuickActionButton = ({ icon, label, onClick, colorClass }: { icon: React.ReactNode, label: string, onClick: () => void, colorClass: string }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center gap-1 group"
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-black/5 transition-all transform active:scale-95 group-hover:-translate-y-1 ${colorClass}`}>
      {icon}
    </div>
    <span className="text-[10px] font-bold text-charcoal/60 uppercase tracking-wide">{label}</span>
  </button>
);

function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // App State
  const [babies, setBabies] = useState<BabyProfile[]>([]);
  const [currentBaby, setCurrentBaby] = useState<BabyProfile | null>(null);
  const [events, setEvents] = useState<BabyEvent[]>([]);
  const [healthEvents, setHealthEvents] = useState<BabyEvent[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Date range for fetching events (default to last 14 days)
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - 14);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  });

  // Adjust date range if selectedDate falls outside of it
  useEffect(() => {
    if (selectedDate < dateRange.start || selectedDate > dateRange.end) {
      const newStart = new Date(Math.min(selectedDate.getTime(), dateRange.start.getTime()));
      const newEnd = new Date(Math.max(selectedDate.getTime(), dateRange.end.getTime()));

      if (selectedDate < dateRange.start) {
        newStart.setDate(newStart.getDate() - 7);
        newStart.setHours(0, 0, 0, 0);
      }
      
      if (selectedDate > dateRange.end) {
        newEnd.setDate(newEnd.getDate() + 7);
        newEnd.setHours(23, 59, 59, 999);
      }
      
      setDateRange({ start: newStart, end: newEnd });
    }
  }, [selectedDate, dateRange.start, dateRange.end]);

  const [filterCategory, setFilterCategory] = useState<FilterCategory>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingEvent, setPendingEvent] = useState<ParseResult | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  // Onboarding / Baby Creation State
  const [showAddBaby, setShowAddBaby] = useState(false);
  const [isCreatingBaby, setIsCreatingBaby] = useState(false); // New loading state for baby creation
  const [newBabyName, setNewBabyName] = useState('');
  const [newBabyDate, setNewBabyDate] = useState(new Date().toISOString().split('T')[0]);

  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);

  // Milestones State
  const [showMilestones, setShowMilestones] = useState(false);

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
    if (user && user.email) {
      const unsubscribe = StorageService.subscribeToBabies(
        user.email,
        (loadedBabies) => {
          setBabies(loadedBabies);
          
          if (loadedBabies.length > 0) {
            // Update current baby if it exists to get latest data, otherwise pick first
            setCurrentBaby(prev => {
              if (prev) {
                const updated = loadedBabies.find(b => b.id === prev.id);
                return updated || loadedBabies[0];
              }
              return loadedBabies[0];
            });

            // If user has babies, check tutorial
            const key = `babylog:tutorial_seen:${user.uid}`;
            if (!localStorage.getItem(key)) {
              setShowTutorial(true);
            }
            setShowAddBaby(false);
          } else {
            setShowAddBaby(true);
            setCurrentBaby(null);
          }
        },
        (error) => {
          console.error("Failed to load babies", error);
        }
      );
      
      checkTutorialStatus(user.uid);
      return () => unsubscribe();
    } else {
      setBabies([]);
      setCurrentBaby(null);
      setEvents([]);
    }
  }, [user?.uid, user?.email]);

  // 3. Load Events when Baby Selected or Date Range Changes
  useEffect(() => {
    if (currentBaby) {
      const unsubscribeEvents = StorageService.subscribeToEvents(
        currentBaby.id,
        dateRange.start,
        dateRange.end,
        (babyEvents) => {
          setEvents(babyEvents);
        },
        (error) => {
          console.error("Failed to load events", error);
          if (error.message.includes('failed-precondition') || error.message.includes('index')) {
            if (error.message.includes('currently building')) {
              alert("The database index is currently building. This usually takes 3-5 minutes. Please wait a moment and refresh the page.");
            } else {
              const urlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
              if (urlMatch) {
                alert(`Firestore requires a composite index to filter events by date. Please click the link in the console or visit: ${urlMatch[0]}`);
              } else {
                alert("Firestore requires a composite index to filter events by date. Please check the browser console for the creation link.");
              }
            }
          }
        }
      );

      setFilterCategory(null);
      return () => {
        unsubscribeEvents();
      };
    } else {
      setEvents([]);
    }
  }, [currentBaby?.id, dateRange.start.getTime(), dateRange.end.getTime()]); // Re-subscribe if baby or date range changes

  // 4. Load Health Events (30 days from TODAY) - Only re-runs if baby changes
  useEffect(() => {
    if (currentBaby) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      const unsubscribeHealth = StorageService.subscribeToHealthEvents(
        currentBaby.id,
        thirtyDaysAgo,
        (hEvents) => {
          setHealthEvents(hEvents);
        },
        (error) => {
          console.error("Failed to load health events", error);
          if (error.message.includes('failed-precondition') || error.message.includes('index')) {
            const urlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
            if (urlMatch) {
              console.log(`Health Log index needed: ${urlMatch[0]}`);
              // We don't alert here to avoid double alerts, but we log it.
            }
          }
        }
      );

      return () => {
        unsubscribeHealth();
      };
    } else {
      setHealthEvents([]);
    }
  }, [currentBaby?.id]); // Only re-subscribe if the active baby changes

  const checkTutorialStatus = (userId: string) => {
    const key = `babylog:tutorial_seen:${userId}`;
    const hasSeen = localStorage.getItem(key);
    // Logic handled in loadBabies usually, but kept here for reference
  };

  const handleAddBaby = async () => {
    if (!newBabyName.trim()) {
      alert("Please enter a name for the baby.");
      return;
    }
    if (!user || !user.email) return;

    setIsCreatingBaby(true);
    try {
      const newBabyData = {
        name: newBabyName,
        birthDate: new Date(newBabyDate).toISOString(),
        gender: Gender.BOY // Defaulting for simplicity
      };

      const createdBaby = await StorageService.saveBaby(user.uid, user.email, newBabyData);
      
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
    } catch (error: any) {
      console.error("Error creating profile:", error);
      
      // Detailed Error Handling for Firestore
      if (error.code === 'permission-denied') {
        alert("Permission Denied: Your Firestore Database Rules are blocking this request. Please go to Firebase Console > Firestore > Rules and allow read/write for authenticated users.");
      } else {
        alert(`Failed to create profile: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsCreatingBaby(false);
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
    }
  };

  // NEW: Direct Manual Entry (No AI Cost)
  const handleManualEntry = (type: EventType) => {
    const now = new Date();
    // Default structure for a new event
    setPendingEvent({
      type: type,
      startTime: now.toISOString(),
      details: {}, // Empty details, user will fill in form
      notes: ''
    });
    setEditingEventId(null);
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
    if (!currentBaby || !user) return;
    
    if (editingEventId) {
      // Update Existing Event
      const updatedEvent: BabyEvent = {
        ...data as BabyEvent,
        id: editingEventId,
        babyId: currentBaby.id,
        createdAt: events.find(e => e.id === editingEventId)?.createdAt || new Date().toISOString(),
        createdByEmail: user.email || ''
      };
      await StorageService.updateEvent(updatedEvent);
    } else {
      // Create New Event
      const { id, ...cleanData } = data as any;
      const newEventData = {
        babyId: currentBaby.id,
        createdAt: new Date().toISOString(),
        createdByEmail: user.email || '',
        ...cleanData
      };
      await StorageService.addEvent(newEventData);
    }
    
    setPendingEvent(null);
    setEditingEventId(null);
    // Real-time listener will update the events list automatically
  };

  const handleDeleteEvent = async () => {
    if (!editingEventId || !currentBaby) return;
    
    try {
      await StorageService.deleteEvent(editingEventId);
      setPendingEvent(null);
      setEditingEventId(null);
      // Real-time listener will update the events list automatically
    } catch (e) {
      console.error("Failed to delete event", e);
      alert("Failed to delete event.");
    }
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

  const handleSeedData = async () => {
    if (!currentBaby || !user || !user.email) return;
    setIsProcessing(true);
    try {
      await generateSeedData(currentBaby.id, user.email);
      // Real-time listener will update the events list automatically
    } catch (error) {
      console.error("Failed to generate seed data", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to extract latest growth stats
  const getLatestGrowth = () => {
    if (!events || events.length === 0) return { weight: null, height: null };
    
    // Events are already sorted DESC by time in StorageService, so we can find the first occurrence
    const weightEvent = events.find(e => e.type === EventType.MEASUREMENT && e.details?.type === 'weight');
    const heightEvent = events.find(e => e.type === EventType.MEASUREMENT && e.details?.type === 'height');

    return {
      weight: weightEvent ? `${weightEvent.details.value}${weightEvent.details.unit}` : null,
      height: heightEvent ? `${heightEvent.details.value}${heightEvent.details.unit}` : null
    };
  };
  
  const growthStats = getLatestGrowth();

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
           <div className="w-20 h-20 bg-rust rounded-full flex items-center justify-center text-white font-bold italic text-4xl mx-auto shadow-xl shadow-rust/30">
             B
           </div>
           <div>
             <h1 className="text-4xl font-bold text-charcoal">BabyLog</h1>
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
      <div className="min-h-screen bg-cream flex flex-col justify-center items-center px-6 animate-fade-in-up relative">
        {/* Cancel Button if user already has babies */}
        {babies.length > 0 ? (
          <button 
            onClick={() => setShowAddBaby(false)}
            className="absolute top-6 left-6 text-charcoal/50 hover:text-charcoal font-bold text-sm flex items-center gap-1 transition-colors"
          >
            ← Back
          </button>
        ) : (
          <button 
            onClick={() => AuthService.signOut()}
            className="absolute top-6 right-6 text-charcoal/50 hover:text-rust font-bold text-sm flex items-center gap-1 transition-colors underline"
          >
            Logout
          </button>
        )}
        <div className="w-full max-w-md bg-surface p-8 rounded-3xl shadow-xl border border-subtle text-center">
          <div className="w-16 h-16 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">👶</div>
          <h1 className="text-3xl font-bold text-charcoal mb-2">
            {babies.length > 0 ? 'Add Another Baby' : 'Welcome!'}
          </h1>
          <p className="text-charcoal/70 mb-8 font-sans">
            {babies.length > 0 ? "Let's create a profile for your other little one." : "Let's create a profile for your little one."}
          </p>
          
          <div className="text-left mb-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-charcoal/60 uppercase tracking-wider mb-2">Baby's Name</label>
              <input
                className="w-full p-4 rounded-xl bg-subtle border-none text-lg font-bold focus:ring-2 focus:ring-rust outline-none transition-all"
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
            disabled={isCreatingBaby}
            className="w-full py-4 bg-rust text-white rounded-xl font-bold text-lg shadow-lg shadow-rust/30 hover:shadow-xl hover:bg-rust/90 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {isCreatingBaby ? (
               <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : "Create Profile"}
          </button>
        </div>
      </div>
    );
  }

  // MAIN APP
  return (
    <div 
      className="min-h-screen bg-cream flex flex-col relative"
      style={{
        paddingTop: 'var(--sat, 0)', 
        paddingBottom: 'var(--sab, 0)',
        paddingLeft: 'var(--sal, 0)',
        paddingRight: 'var(--sar, 0)'
      }}
    >
      
      {/* 1. Header & Hero */}
      <div className="bg-cream px-6 pt-8 pb-4 max-w-5xl mx-auto w-full">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-rust rounded-full flex items-center justify-center text-white font-bold italic">B</span>
            <span className="font-bold text-xl text-charcoal">BabyLog</span>
          </div>
          
          {/* Profile Switcher & Logout */}
          <div className="flex items-center gap-3">
             {/* Help Button */}
             <button 
                onClick={() => setShowTutorial(true)}
                className="w-8 h-8 rounded-full border border-subtle text-charcoal/50 font-bold hover:text-rust hover:border-rust transition-colors flex items-center justify-center"
                title="Replay Tutorial"
             >
               ?
             </button>

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
                id="tutorial-add-baby-btn"
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
             <h1 className="text-3xl md:text-4xl font-bold text-charcoal">
               Daily Overview
             </h1>
             <div className="flex flex-wrap items-center gap-2 text-charcoal/60 mt-1 text-sm md:text-base">
               <span className="font-bold text-charcoal">{currentBaby?.name}</span>
               
               {/* Share Button */}
               {currentBaby && (
                 <button 
                   id="tutorial-share-btn"
                   onClick={() => setShowShareModal(true)}
                   className="flex items-center gap-1 bg-sage/10 text-sage hover:bg-sage/20 px-2 py-0.5 rounded-full text-xs font-bold transition-colors mr-1"
                 >
                   <UserPlusIcon className="w-3 h-3" />
                   <span>Share</span>
                 </button>
               )}

               {/* Seed Data Button */}
               {currentBaby && (
                 <button 
                   onClick={handleSeedData}
                   disabled={isProcessing}
                   className="flex items-center gap-1 bg-rust/10 text-rust hover:bg-rust/20 px-2 py-0.5 rounded-full text-xs font-bold transition-colors mr-1 disabled:opacity-50"
                 >
                   <SparklesIcon className="w-3 h-3" />
                   <span>Seed Data</span>
                 </button>
               )}
               
               <span className="text-charcoal/30">•</span>
               <span>{currentBaby ? calculateAge(currentBaby.birthDate) : ''}</span>

               {/* Latest Growth Stats in Header */}
               {growthStats.weight && (
                 <>
                   <span className="text-charcoal/30">•</span>
                   <span className="font-semibold text-charcoal/80">{growthStats.weight}</span>
                 </>
               )}
               {growthStats.height && (
                 <>
                   <span className="text-charcoal/30">•</span>
                   <span className="font-semibold text-charcoal/80">{growthStats.height}</span>
                 </>
               )}

             </div>
          </div>

          {/* Date Navigator */}
          <div className="flex items-center bg-white rounded-xl border border-subtle shadow-sm p-1">
             <button onClick={() => handleDateChange(-1)} className="p-2 hover:bg-subtle rounded-lg text-charcoal/60">
                <ChevronLeftIcon className="w-5 h-5" />
             </button>
             <div className="px-4 py-2 min-w-[140px] text-center relative">
                <span className="block text-xs font-bold uppercase text-charcoal/40 tracking-wider">Viewing</span>
                <label className="flex items-center justify-center gap-1.5 font-bold text-charcoal cursor-pointer hover:text-rust transition-colors relative">
                  {selectedDate.toDateString() === new Date().toDateString() ? 'Today' : selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  <CalendarIcon className="w-4 h-4 text-charcoal/40" />
                  <input 
                    type="date" 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    value={selectedDate.toISOString().split('T')[0]}
                    min={currentBaby ? new Date(currentBaby.birthDate).toISOString().split('T')[0] : undefined}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      if (e.target.value) {
                        const [year, month, day] = e.target.value.split('-');
                        setSelectedDate(new Date(Number(year), Number(month) - 1, Number(day)));
                      }
                    }}
                    onClick={(e) => {
                      try {
                        if ('showPicker' in HTMLInputElement.prototype) {
                          (e.target as HTMLInputElement).showPicker();
                        }
                      } catch (err) {
                        // ignore
                      }
                    }}
                  />
                </label>
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
               <h2 className="font-bold text-xl text-charcoal">
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
             <div id="tutorial-view-tabs" className="flex bg-white rounded-lg p-1 border border-subtle shadow-sm">
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
                onEditEvent={handleEditEvent}
             />
           )}
           
           {viewMode === 'report' && (
             <ConsolidatedReport events={events} healthEvents={healthEvents} selectedDate={selectedDate} />
           )}
        </div>

      </main>

      {/* Floating Milestone Button */}
      {currentBaby && (
        <button
          onClick={() => setShowMilestones(true)}
          className="fixed bottom-32 right-6 z-40 bg-white border border-sage/30 shadow-lg p-3 rounded-full flex items-center gap-2 hover:bg-sage/10 transition-colors animate-bounce-slow"
          title="View Milestones"
        >
          <span className="text-2xl">👶</span>
          <span className="text-sm font-bold text-charcoal pr-2 hidden md:inline">Milestones</span>
        </button>
      )}

      {/* 3. Sticky Footer / Quick Actions Dock */}
      <div 
         className="fixed bottom-0 left-0 right-0 px-4 pb-2 bg-gradient-to-t from-cream via-cream to-transparent z-20" 
         style={{ paddingBottom: 'calc(0.5rem + var(--sab, 0))' }}
      >
        <div id="tutorial-quick-actions" className="max-w-xl mx-auto flex items-end justify-between gap-2 md:gap-4 px-2">
          
          <QuickActionButton 
            label="Feed" 
            icon={<FeedIcon className="w-6 h-6 text-rust" />} 
            colorClass="bg-[#FDECE8]" 
            onClick={() => handleManualEntry(EventType.FEED)}
          />
          
          <QuickActionButton 
            label="Sleep" 
            icon={<MoonIcon className="w-6 h-6 text-sage" />} 
            colorClass="bg-[#E6F4F1]" 
            onClick={() => handleManualEntry(EventType.SLEEP)}
          />

          {/* Voice Button (Floating Center) */}
          <div id="tutorial-voice-btn" className="-mb-2 z-10">
            <VoiceRecorder 
              onRecordingComplete={(blob) => processInput(undefined, blob)} 
              isProcessing={isProcessing} 
            />
          </div>

          <QuickActionButton 
            label="Diaper" 
            icon={<DiaperIcon className="w-6 h-6 text-sand" />} 
            colorClass="bg-[#FFF8E1]" 
            onClick={() => handleManualEntry(EventType.DIAPER)}
          />

          <QuickActionButton 
            label="More" 
            icon={<PlusIcon className="w-6 h-6 text-charcoal/60" />} 
            colorClass="bg-white" 
            onClick={() => handleManualEntry(EventType.NOTE)}
          />

        </div>
      </div>

      {/* Modals */}
      {showMilestones && currentBaby && (
        <MilestoneView
          baby={currentBaby}
          onClose={() => setShowMilestones(false)}
        />
      )}

      {showTutorial && (
        <TutorialOverlay 
          onClose={closeTutorial} 
          userName={user.displayName?.split(' ')[0]} 
        />
      )}

      {showShareModal && currentBaby && (
        <ShareBabyModal 
          baby={currentBaby}
          onClose={() => {
            setShowShareModal(false);
            // Real-time listener will automatically pick up changes
          }}
          currentUserEmail={user.email}
          currentUserId={user.uid}
        />
      )}

      {pendingEvent && (
        <EventConfirmation 
          data={pendingEvent} 
          mode={editingEventId ? 'edit' : 'create'}
          onConfirm={saveEvent} 
          onCancel={cancelEdit} 
          onDelete={editingEventId ? handleDeleteEvent : undefined}
        />
      )}
    </div>
  );
}

export default App;


import React, { useState } from 'react';
import { BabyProfile } from '../types';
import { StorageService } from '../services/storageService';
import { XMarkIcon, UserPlusIcon } from './Icons';

interface Props {
  baby: BabyProfile;
  onClose: () => void;
  currentUserEmail: string | null | undefined;
  currentUserId: string;
}

const ShareBabyModal: React.FC<Props> = ({ baby, onClose, currentUserEmail, currentUserId }) => {
  const [emailToInvite, setEmailToInvite] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isOwner = baby.ownerId === currentUserId;

  const handleInvite = async () => {
    if (!emailToInvite.trim()) return;
    if (!emailToInvite.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const email = emailToInvite.trim().toLowerCase();
      await StorageService.shareBaby(baby.id, email);
      setEmailToInvite('');
      setSuccess(`${email} has been added!`);
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError('Failed to share. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (email: string) => {
    if (!window.confirm(`Remove access for ${email}?`)) return;
    
    setLoading(true);
    try {
      await StorageService.unshareBaby(baby.id, email);
    } catch (e) {
      setError('Failed to remove user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-surface rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
        
        <div className="bg-cream border-b border-subtle p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-charcoal">Family Access</h2>
            <p className="text-charcoal/60 text-xs">Manage who can see {baby.name}</p>
          </div>
          <button onClick={onClose} className="text-charcoal/30 hover:text-charcoal">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Invite Form - ONLY OWNER SEES THIS */}
          {isOwner ? (
            <div className="bg-subtle/50 p-4 rounded-xl border border-subtle transition-all">
              <label className="block text-xs font-bold text-charcoal/50 uppercase mb-2">Invite Caregiver</label>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="family@gmail.com"
                  className="flex-1 bg-white p-2 rounded-lg border-none text-sm focus:ring-2 focus:ring-rust/30"
                  value={emailToInvite}
                  onChange={(e) => {
                    setEmailToInvite(e.target.value);
                    if (error) setError(null);
                    if (success) setSuccess(null);
                  }}
                />
                <button 
                  onClick={handleInvite}
                  disabled={loading || !emailToInvite}
                  className="bg-rust text-white p-2 rounded-lg disabled:opacity-50 hover:bg-rust/90 transition-colors"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlusIcon className="w-5 h-5" />}
                </button>
              </div>

              {/* Feedback Messages */}
              {success && (
                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-sage animate-fade-in-up">
                  <span className="w-4 h-4 bg-sage rounded-full flex items-center justify-center text-white">✓</span>
                  {success}
                </div>
              )}
              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </div>
          ) : (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-charcoal/70">
              Only the profile owner can add or remove family members.
            </div>
          )}

          {/* List */}
          <div>
             <label className="block text-xs font-bold text-charcoal/50 uppercase mb-3">Who has access</label>
             <div className="space-y-3 max-h-[200px] overflow-y-auto no-scrollbar pr-1">
               {baby.allowedEmails?.map((email) => (
                 <div key={email} className="flex justify-between items-center bg-white p-3 rounded-xl border border-subtle shadow-sm">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center text-sage font-bold text-xs">
                         {email[0].toUpperCase()}
                       </div>
                       <div>
                         <p className="text-sm font-bold text-charcoal">{email}</p>
                         <div className="flex gap-2">
                           {email === currentUserEmail && <span className="text-[10px] text-rust bg-rust/10 px-1.5 py-0.5 rounded">You</span>}
                         </div>
                       </div>
                    </div>
                    
                    {isOwner && email !== currentUserEmail && (
                      <button 
                        onClick={() => handleRemove(email)}
                        className="text-xs text-charcoal/40 hover:text-red-500 underline"
                        disabled={loading}
                      >
                        Remove
                      </button>
                    )}
                 </div>
               ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ShareBabyModal;

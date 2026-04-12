import { useState, useEffect } from 'react';
import CustomButton from './CustomButton';
import CustomInput from './CustomInput';
import useChatStore from '../store/chatStore';

const ProfileModal = ({ isOpen, onClose, onSave }) => {
  const voiceSettings = useChatStore((s) => s.voiceSettings);
  const updateVoiceSettings = useChatStore((s) => s.updateVoiceSettings);
  
  const [profile, setProfile] = useState({
    name: 'Patel',
    email: 'patel@gmail.com',
    avatar: '',
    preferences: {
      chatbotType: 'friendly',
      language: voiceSettings.language,
      notifications: true,
      autoPlayTTS: voiceSettings.autoPlay,
    },
  });

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      setProfile((p) => ({
        ...p,
        preferences: {
          ...p.preferences,
          language: voiceSettings.language,
          autoPlayTTS: voiceSettings.autoPlay,
        }
      }));
    }
  }, [isOpen, voiceSettings.language, voiceSettings.autoPlay]);

  const handleSave = () => {
    // Save to global Zustand store
    updateVoiceSettings({
      language: profile.preferences.language,
      autoPlay: profile.preferences.autoPlayTTS,
    });
    
    onSave(profile);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/85 animate-fade-in"
        onClick={onClose}
      />
      <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-thin animate-scale-in">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-pink-500 to-blue-600 bg-clip-text text-transparent">
            Profile Settings
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Name
              </label>
              <CustomInput
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
                className="bg-input border-border text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <CustomInput
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
                className="bg-input border-border text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Chatbot Type
              </label>
              <select
                value={profile.preferences.chatbotType}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    preferences: {
                      ...profile.preferences,
                      chatbotType: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 text-white bg-black border border-gray-300 rounded-md  focus:outline-none focus:ring-2 "
              >
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="creative">Creative</option>
                <option value="analytical">Analytical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Language
              </label>
              <select
                value={profile.preferences.language}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    preferences: {
                      ...profile.preferences,
                      language: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 bg-black focus:ring-ring cursor-pointer text-foreground"
              >
                <option value="en-US">English</option>
                <option value="hi-IN">Hindi</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Auto-speak AI Responses
              </label>
              <button
                onClick={() =>
                  setProfile({
                    ...profile,
                    preferences: {
                      ...profile.preferences,
                      autoPlayTTS: !profile.preferences.autoPlayTTS,
                    },
                  })
                }
                className={`relative inline-flex h-5 w-14 items-center rounded-full transition-colors ${
                  profile.preferences.autoPlayTTS
                    ? 'text-pink-400'
                    : 'bg-pink-400'
                }`}
              >
                <span
                  className={`inline-block h-4 w-5 transform rounded-full  transition-transform ${
                    profile.preferences.autoPlayTTS
                      ? 'translate-x-5 bg-green-400'
                      : '-translate-x-5 bg-red-500'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-border">
            <CustomButton
              onClick={onClose}
              variant="outline"
              className="flex-1 border-border text-foreground hover:bg-muted"
            >
              Cancel
            </CustomButton>
            <CustomButton
              onClick={handleSave}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Save Changes
            </CustomButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;

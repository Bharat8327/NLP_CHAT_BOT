import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomButton from './CustomButton.jsx';
import { CustomCard } from './CustomCard.jsx';
import ProfileModal from './ProfileModal.jsx';
import LogoutModal from './LogoutModal.jsx';

const UserProfile = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log('User logged out');
    navigate('/login');
  };

  const handleProfileSave = (profileData) => {
    console.log('Profile saved:', profileData);
  };

  return (
    <>
      <div className="relative ">
        <CustomButton
          onClick={() => setIsOpen(!isOpen)}
          variant="ghost"
          className="rounded-full w-10 h-10   "
        >
          <p className="bg-white w-10 rounded-md">👤</p>
        </CustomButton>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10   "
              onClick={() => setIsOpen(false)}
            />
            <CustomCard className="absolute right-0 top-12 w-72 shadow-xl z-20 bg-card border-border animate-scale-in">
              <div className="p-4">
                <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-border">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">User Name</p>
                    <p className="text-sm text-muted-foreground">
                      user@example.com
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <CustomButton
                    onClick={() => {
                      setShowProfileModal(true);
                      setIsOpen(false);
                    }}
                    variant="ghost"
                    className="w-full justify-start text-foreground hover:bg-muted"
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Profile Settings
                  </CustomButton>
                  <CustomButton
                    onClick={() => {
                      setShowProfileModal(true);
                      setIsOpen(false);
                    }}
                    variant="ghost"
                    className="w-full justify-start text-foreground hover:bg-muted"
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Preferences
                  </CustomButton>
                  <hr className="my-2 border-border" />
                  <CustomButton
                    onClick={() => {
                      setShowLogoutModal(true);
                      setIsOpen(false);
                    }}
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:bg-destructive/10"
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Logout
                  </CustomButton>
                </div>
              </div>
            </CustomCard>
          </>
        )}
      </div>

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSave={handleProfileSave}
      />

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </>
  );
};

export default UserProfile;

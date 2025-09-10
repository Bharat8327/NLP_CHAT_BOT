import CustomButton from './CustomButton';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 text-black">
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in"
        onClick={onClose}
      />
      <div className="relative bg-card  border border-border rounded-lg shadow-xl w-full max-w-sm animate-scale-in">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-2 bg-gradient-to-r from-blue-900 to-pink-900 bg-clip-text text-transparent">
            Confirm Logout
          </h2>
          <p className="text-muted-foreground mb-6 text-white">
            Are you sure you want to logout? You'll need to sign in again to
            access your account.
          </p>
          <div className="flex gap-2">
            <CustomButton
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-800 hover:!bg-cyan-500 hover:!text-white"
            >
              Cancel
            </CustomButton>

            <CustomButton
              onClick={onConfirm}
              className="flex-1 bg-red-600 text-white hover:!bg-red-700"
            >
              Yes, Logout
            </CustomButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;

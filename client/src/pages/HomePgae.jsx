import { useState } from 'react';
import ChatSidebar from '../components/ChatSidebar.jsx';
import ChatInterface from '../components/ChatInterface.jsx';
import UserProfile from '../components/UserProfile.jsx';

const ChatBot = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentChatId, setCurrentChatId] = useState('1');
  const [chatData, setChatData] = useState({});

  const handleChatSelect = (chatId) => {
    setCurrentChatId(chatId);
  };

  const handleNewChat = () => {
    const newChatId = Date.now().toString();
    setCurrentChatId(newChatId);
  };

  const handleChatChange = (chatId, messages) => {
    setChatData((prev) => ({ ...prev, [chatId]: messages }));
  };

  return (
    <div className="h-screen flex ">
      <ChatSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        currentChatId={currentChatId}
      />
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-gray-200  flex items-center justify-between sm:px-6">
          <h1 className="text-sm bg-gradient-to-r from-pink-600 to-green-300 bg-clip-text text-transparent max-w-md">
            AI Assistant
          </h1>
          <UserProfile />
        </header>
        <ChatInterface
          currentChatId={currentChatId}
          onChatChange={handleChatChange}
        />
      </div>
    </div>
  );
};

export default ChatBot;

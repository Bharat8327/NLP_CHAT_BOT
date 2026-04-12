import { useState } from 'react';
import CustomButton from './CustomButton';
import { CustomCard } from './CustomCard';
import { GoSidebarCollapse } from 'react-icons/go';
import { TbLayoutSidebarLeftCollapse } from 'react-icons/tb';
import useChatStore from '../store/chatStore';

const ChatSidebar = ({
  collapsed,
  onToggle,
}) => {
  const { chats, deleteChat, createChat, activeChatId, setActiveChat } = useChatStore();
  
  // Convert chat store object to sorted array visually
  const chatHistory = Object.values(chats).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

  const handleCreateNewChat = () => {
    // Zustand directly creates and maps it natively!
    createChat();
  };

  return (
    <div
      className={`${
        collapsed ? 'w-16' : 'w-80'
      } bg-card border-r border-border flex flex-col transition-all duration-300 shadow-sm`}
    >
      <div className="p-4 border-b border-border">
        <CustomButton
          onClick={onToggle}
          variant="ghost"
          size="icon"
          className="w-8 h-8 "
        >
          {collapsed ? (
            <p>
              <GoSidebarCollapse />
            </p>
          ) : (
            <p>
              <TbLayoutSidebarLeftCollapse />
            </p>
          )}
        </CustomButton>
      </div>

      {!collapsed && (
        <>
          <div className="p-4">
            <CustomButton
              onClick={handleCreateNewChat}
              className="w-full  
                bg-gradient-to-r from-pink-500 to-blue-600 "
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Chat
            </CustomButton>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Chat History
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[470px] md:max-h-[800px] lg:max-h-[500px]  px-2 space-y-1 custom-scrollbar  [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {chatHistory.map((chat) => (
              <CustomCard
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={`cursor-pointer p-3 hover:bg-muted/50 transition-colors group ${
                  activeChatId === chat.id
                    ? 'bg-accent border-primary/20 shadow-sm'
                    : 'border-border'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {chat.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {chat.timestamp}
                    </p>
                  </div>
                  <CustomButton
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    variant="ghost"
                    size="sm"
                    className="ml-2 text-muted-foreground  group-hover:opacity-100 transition-opacity 
             hover:text-white hover:bg-gradient-to-r hover:from-pink-500 hover:to-red-500"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </CustomButton>
                </div>
              </CustomCard>
            ))}
          </div>
        </>
      )}

      {collapsed && (
        <div className="p-2">
          <CustomButton
            onClick={handleCreateNewChat}
            variant="ghost"
            size="icon"
            className="w-12 h-12 hover:bg-muted"
            title="New Chat"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </CustomButton>
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;

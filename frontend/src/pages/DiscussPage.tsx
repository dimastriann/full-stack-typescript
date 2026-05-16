import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_MY_CONVERSATIONS } from '../features/chat/gql/chat.graphql';
import { ConversationList } from '../features/chat/components/ConversationList';
import { ChatWindow } from '../features/chat/components/ChatWindow';
import type { Conversation } from '../features/chat/types';

const DiscussPage = () => {
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const { data, loading, error } = useQuery(GET_MY_CONVERSATIONS, {
    pollInterval: 10000, // Optional poll for new conversations
  });

  if (loading && !data)
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-50 dark:bg-slate-950 transition-colors">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">
            Loading discussions...
          </p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex-1 p-8 bg-surface-50 dark:bg-slate-950 transition-colors">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-6 rounded-2xl shadow-sm max-w-2xl mx-auto">
          <div className="font-bold text-lg mb-2 flex items-center gap-2">
            <span className="p-1 bg-red-100 dark:bg-red-900/40 rounded-lg">
              ⚠️
            </span>
            Error loading discussions
          </div>
          <div className="text-sm opacity-90 leading-relaxed">
            {error.message}
          </div>
        </div>
      </div>
    );

  const conversations = data?.myConversations || [];

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-surface-50 dark:bg-slate-950 transition-colors">
      <div
        className={`${
          selectedConversation ? 'hidden md:block' : 'block'
        } w-full md:w-80 lg:w-96 border-r border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors`}
      >
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation?.id}
          onSelect={setSelectedConversation}
        />
      </div>
      <div
        className={`${
          selectedConversation ? 'block' : 'hidden md:block'
        } flex-1 flex flex-col min-w-0 h-full`}
      >
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            onBack={() => setSelectedConversation(null)}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-900 m-4 rounded-2xl border-2 border-dashed border-surface-200 dark:border-slate-800 transition-colors">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Select a discussion
              </p>
              <p className="text-sm">Choose a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscussPage;

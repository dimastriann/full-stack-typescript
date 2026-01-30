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
    return <div className="p-8">Loading discussions...</div>;
  if (error)
    return <div className="p-8 text-red-500">Error: {error.message}</div>;

  const conversations = data?.myConversations || [];

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-100">
      <div
        className={`${
          selectedConversation ? 'hidden md:block' : 'block'
        } w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white`}
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
          <div className="h-full flex items-center justify-center text-gray-400 bg-white m-4 rounded-lg border border-dashed border-gray-300">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscussPage;

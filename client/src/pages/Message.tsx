import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

type MessageType = {
  id: string;
  senderId: string;
  senderName: string;
  senderProfileImageUrl?: string;
  message: string;
  to: string;
  timestamp: string;
};

type ContactType = {
  id: string;
  fullName: string;
  profileImageUrl?: string;
  unreadCount?: number;
  isGroup?: boolean;
};

function Avatar({ src, name }: { src?: string; name: string }) {
  return src ? (
    <img src={src} alt={name} className="w-10 h-10 rounded-full object-cover" />
  ) : (
    <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-lg font-bold text-blue-700">
      {name[0]}
    </div>
  );
}

function ContactList({ contacts, selectedId, onSelect }: {
  contacts: ContactType[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {contacts.map(contact => (
        <button
          key={contact.id}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full text-left hover:bg-blue-50 transition relative ${selectedId === contact.id ? "bg-blue-100" : "bg-white"}`}
          onClick={() => onSelect(contact.id)}
        >
          <Avatar src={contact.profileImageUrl} name={contact.fullName} />
          <span className="font-semibold text-sm">{contact.fullName}{contact.isGroup ? " (Group)" : ""}</span>
          {contact.unreadCount && contact.unreadCount > 0 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{contact.unreadCount}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function ChatBubble({ message, isOwn, senderName, senderProfileImageUrl, timestamp }: { message: string; isOwn: boolean; senderName: string; senderProfileImageUrl?: string; timestamp: string }) {
  return (
    <div className={`flex mb-2 ${isOwn ? "justify-end" : "justify-start"}`}>
      {!isOwn && (
        <Avatar src={senderProfileImageUrl} name={senderName} />
      )}
      <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow text-sm relative ${isOwn ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-900"}`}>
        <span className="block font-semibold mb-1">{senderName}</span>
        <span>{message}</span>
        <span className="block text-xs text-gray-400 mt-1 text-right">{new Date(timestamp).toLocaleString()}</span>
      </div>
    </div>
  );
}


const Message = () => {
  const { user } = useAuth() as { user?: User };
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showChatPage, setShowChatPage] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ...existing code for fetching teamMembers and adminInfo...
  const { data: teamMembers = [] } = useQuery<User[]>({
    queryKey: ["/api/company", user?.companyCode, "users"],
    enabled: !!user && user.role === "admin" && !!user.companyCode,
    queryFn: async () => {
      if (!user?.companyCode) return [];
      const res = await fetch(`/api/company/${user.companyCode}/users`);
      if (!res.ok) throw new Error("Failed to fetch team members");
      return await res.json();
    },
  });
  const { data: adminInfo } = useQuery<User>({
    queryKey: ["/api/company", user?.companyCode, "admin"],
    enabled: !!user && user.role !== "admin" && !!user.companyCode,
    queryFn: async () => {
      if (!user?.companyCode) return null;
      const res = await fetch(`/api/company/${user.companyCode}/admin`);
      if (!res.ok) throw new Error("Failed to fetch admin info");
      return await res.json();
    },
  });

  // ...existing code for contacts logic...
  let contacts: ContactType[] = [];
if (user?.role === "admin") {
  contacts = [
    { id: "all", fullName: "All Team", isGroup: true },
    ...teamMembers.map(tm => ({
      id: tm.id,
      fullName: tm.fullName ?? "",
      profileImageUrl: tm.profileImageUrl ?? undefined,
    })),
  ];
} else if (user?.role === "user") {
  // Always show both admin and group, even if adminInfo is missing
  contacts = [];
  if (adminInfo && adminInfo.id) {
    // Use real admin ID from backend
    contacts.push({ id: adminInfo.id, fullName: adminInfo.fullName ?? "Admin", profileImageUrl: adminInfo.profileImageUrl ?? undefined });
  } else {
    // Fallback: try to fetch admin ID from teamMembers with role 'admin'
    const adminFromTeam = Array.isArray(teamMembers) ? teamMembers.find(tm => tm.role === "admin") : undefined;
    if (adminFromTeam && adminFromTeam.id) {
      contacts.push({ id: adminFromTeam.id, fullName: adminFromTeam.fullName ?? "Admin", profileImageUrl: adminFromTeam.profileImageUrl ?? undefined });
    } else {
      contacts.push({ id: "admin", fullName: "Admin", profileImageUrl: undefined });
    }
  }
  contacts.push({ id: "all", fullName: "All Team", isGroup: true });
}

  // ...existing code for message fetching...
  useEffect(() => {
    if (!selectedContactId) return;
    const fetchMessages = async () => {
      let url = `/api/messages?to=${selectedContactId}`;
      // Always fetch with both to and from for direct user-admin chats
      if (user?.role === "user" && adminInfo && selectedContactId === adminInfo.id) {
        url += `&from=${user.id}`;
      } else if (user?.role === "admin" && selectedContactId !== "all") {
        url += `&from=${user.id}`;
      } else if (user?.role === "user" && selectedContactId !== "all" && selectedContactId !== adminInfo?.id) {
        // If user is chatting with another user (future-proof)
        url += `&from=${user.id}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const msgs = await res.json();
        setMessages(msgs);
      } else {
        setMessages([]);
      }
    };
    fetchMessages();
  }, [user, selectedContactId, adminInfo, teamMembers]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ...existing code for sending messages...
  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || !selectedContactId || !user) return;
    const now = new Date();
    const timestamp = now.toISOString();
    let payload = {
      senderId: user.id,
      senderName: user.fullName ?? "",
      senderProfileImageUrl: user.profileImageUrl ?? undefined,
      message: input,
      to: selectedContactId,
      timestamp,
    };
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages([...messages, msg]);
    }
    setInput("");
    inputRef.current?.focus();
  };

  // WhatsApp-style layout with separate chat page for admin
  if (user?.role === "admin" && showChatPage && selectedContactId) {
    const contact = contacts.find(c => c.id === selectedContactId);
    return (
      <div className="min-h-screen w-full bg-[#121212] flex flex-col">
        <div className="w-full h-full bg-[#1e1e1e] rounded-none shadow-none overflow-hidden flex flex-col" style={{ minHeight: '100vh' }}>
          {/* Header with back arrow and contact/group name */}
          <div className="flex items-center px-6 py-4 bg-blue-600 text-white">
            <button
              className="mr-4 text-white hover:text-blue-200"
              onClick={() => setShowChatPage(false)}
              aria-label="Back"
            >
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex-1 text-center font-bold text-lg">
              {contact?.fullName}{contact?.isGroup ? " (Group)" : ""}
            </div>
          </div>
          {/* Messages */}
          <div className="flex-1 px-6 py-4 overflow-y-auto" style={{ background: "#121212" }}>
            {messages.map((msg, idx) => (
              <ChatBubble
                key={msg.id || idx}
                message={msg.message}
                isOwn={msg.senderId === user?.id}
                senderName={msg.senderName}
                senderProfileImageUrl={msg.senderProfileImageUrl}
                timestamp={msg.timestamp}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
          {/* Message Input: Always show for admin, for any contact/group */}
          <form 
            onSubmit={handleSend} 
            className="flex items-center px-3 py-2 bg-[#2c2c2c] border-t safe-area-pb" 
            style={{ position: 'fixed', left: 0, right: 0, bottom: '64px', width: '100%', zIndex: 100 }}
          >
            <input
              ref={inputRef}
              type="text"
              className="flex-1 px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-400 bg-[#3c3c3c] text-white"
              placeholder={selectedContactId === "all" ? "Type a message to all team..." : `Type a message to ${contact?.fullName}...`}
              value={input}
              onChange={e => setInput(e.target.value)}
              maxLength={500}
              autoComplete="off"
              required
            />
            <button
              type="submit"
              className="ml-2 px-4 py-2 rounded-full bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main message page (contact list)
  // User chat page (like admin)
  if (user?.role === "user" && showChatPage && selectedContactId) {
    const contact = contacts.find(c => c.id === selectedContactId);
    return (
      <div className="min-h-screen w-full bg-[#121212] flex flex-col">
        <div className="w-full h-full bg-[#1e1e1e] rounded-none shadow-none overflow-hidden flex flex-col" style={{ minHeight: '100vh' }}>
          {/* Header with back arrow and contact/group name */}
          <div className="flex items-center px-6 py-4 bg-blue-600 text-white">
            <button
              className="mr-4 text-white hover:text-blue-200"
              onClick={() => setShowChatPage(false)}
              aria-label="Back"
            >
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex-1 text-center font-bold text-lg">
              {contact?.fullName}{contact?.isGroup ? " (Group)" : ""}
            </div>
          </div>
          {/* Messages */}
          <div className="flex-1 px-6 py-4 overflow-y-auto" style={{ background: "#121212" }}>
            {messages.map((msg, idx) => (
              <ChatBubble
                key={msg.id || idx}
                message={msg.message}
                isOwn={msg.senderId === user?.id}
                senderName={msg.senderName}
                senderProfileImageUrl={msg.senderProfileImageUrl}
                timestamp={msg.timestamp}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
          {/* Message Input: Only show for user if not viewing All Team group */}
          {user?.role === "user" && selectedContactId && selectedContactId !== "all" && (
            <form onSubmit={handleSend} className="flex items-center px-3 py-2 bg-[#2c2c2c] border-t safe-area-pb" style={{ position: 'fixed', left: 0, right: 0, bottom: '64px', width: '100%', zIndex: 100 }}>
                <input
                  ref={inputRef}
                  type="text"
                  className="flex-1 px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-400 bg-[#3c3c3c] text-white"
                  placeholder={`Type a message to ${contact?.fullName}...`}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  maxLength={500}
                  autoComplete="off"
                  required
                />
              <button
                type="submit"
                className="ml-2 px-4 py-2 rounded-full bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Main message page (contact list)
  return (
    <div className="min-h-screen w-screen bg-[#121212] flex flex-row">
      {/* Sidebar: Contact List */}
      <div className="h-[100vh] flex flex-col p-4 bg-[#1e1e1e] rounded-l-lg shadow-lg overflow-y-auto" style={{ width: '350px', minWidth: '300px' }}>
        <div className="font-bold text-lg mb-4 text-white">Chats</div>
        <ContactList
          contacts={contacts}
          selectedId={selectedContactId}
          onSelect={id => {
            setSelectedContactId(id);
            if (user?.role === "admin" || user?.role === "user") setShowChatPage(true);
          }}
        />
      </div>
      {/* Chat Window (for user only, admin uses separate page) */}
      {user?.role !== "admin" && !showChatPage && (
        <div className="flex-1 bg-[#121212] rounded-r-lg shadow-lg overflow-hidden flex flex-col h-[100vh]">
          {/* Optionally, show a welcome or placeholder here */}
        </div>
      )}
    </div>
  );
};

export default Message;

import { Message } from '@/types';

const DB_KEY = 'just_dogs_messages_db';

interface MessageDB {
  messages: Message[];
  nextId: number;
}

// Initialize the database in localStorage
const initializeDB = (): MessageDB => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // Return default data for server-side rendering
    return {
      messages: [
        {
          id: '1',
          sender_id: '1',
          recipient_id: '2',
          subject: 'Welcome to Just Dogs!',
          content: 'Welcome to our platform! We\'re excited to help you with your dog training needs.',
          is_announcement: false,
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          updated_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '2',
          sender_id: '2',
          recipient_id: '1',
          subject: 'Training Session Request',
          content: 'Hi! I\'d like to schedule a training session for my dog. When would be a good time?',
          is_announcement: false,
          created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          updated_at: new Date(Date.now() - 172800000).toISOString(),
        },
      ],
      nextId: 3,
    };
  }
  
  const stored = localStorage.getItem(DB_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Initialize with some sample messages
  const initialData: MessageDB = {
    messages: [
      {
        id: '1',
        sender_id: '1',
        recipient_id: '2',
        subject: 'Welcome to Just Dogs!',
        content: 'Welcome to our platform! We\'re excited to help you with your dog training needs.',
        is_announcement: false,
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updated_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: '2',
        sender_id: '2',
        recipient_id: '1',
        subject: 'Training Session Request',
        content: 'Hi! I\'d like to schedule a training session for my dog. When would be a good time?',
        is_announcement: false,
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        updated_at: new Date(Date.now() - 172800000).toISOString(),
      },
    ],
    nextId: 3,
  };
  localStorage.setItem(DB_KEY, JSON.stringify(initialData));
  return initialData;
};

let db = initializeDB();

const saveDB = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }
};

export const createMessage = (messageData: Omit<Message, 'id' | 'created_at' | 'updated_at'>): Message => {
  const newMessage: Message = {
    id: (db.nextId++).toString(),
    ...messageData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.messages.push(newMessage);
  saveDB();
  return newMessage;
};

export const getAllMessages = (): Message[] => {
  return db.messages;
};

export const getMessagesByUser = (userId: string): Message[] => {
  return db.messages.filter(message => 
    message.sender_id === userId || 
    message.recipient_id === userId ||
    message.is_announcement
  );
};

export const getMessagesByRecipient = (recipientId: string): Message[] => {
  return db.messages.filter(message => 
    message.recipient_id === recipientId ||
    message.is_announcement
  );
};

export const getMessagesBySender = (senderId: string): Message[] => {
  return db.messages.filter(message => message.sender_id === senderId);
};

export const getMessageById = (id: string): Message | undefined => {
  return db.messages.find(message => message.id === id);
};

export const updateMessage = (id: string, updates: Partial<Omit<Message, 'id' | 'created_at'>>): Message | undefined => {
  const messageIndex = db.messages.findIndex(message => message.id === id);
  if (messageIndex > -1) {
    db.messages[messageIndex] = {
      ...db.messages[messageIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveDB();
    return db.messages[messageIndex];
  }
  return undefined;
};

export const deleteMessage = (id: string): boolean => {
  const initialLength = db.messages.length;
  db.messages = db.messages.filter(message => message.id !== id);
  if (db.messages.length < initialLength) {
    saveDB();
    return true;
  }
  return false;
};

export const searchMessages = (searchTerm: string, userId?: string): Message[] => {
  const lowerCaseSearchTerm = searchTerm.toLowerCase();
  const filteredMessages = userId ? getMessagesByUser(userId) : getAllMessages();

  return filteredMessages.filter(message =>
    message.subject.toLowerCase().includes(lowerCaseSearchTerm) ||
    message.content.toLowerCase().includes(lowerCaseSearchTerm)
  );
};

export const getUnreadMessages = (userId: string): Message[] => {
  return db.messages.filter(message => 
    (message.recipient_id === userId || message.is_announcement) &&
    !message.read_at
  );
};

export const markMessageAsRead = (messageId: string): Message | undefined => {
  return updateMessage(messageId, { read_at: new Date().toISOString() });
};

// For development/testing: reset the database
export const resetDB = () => {
  localStorage.removeItem(DB_KEY);
  db = initializeDB();
};

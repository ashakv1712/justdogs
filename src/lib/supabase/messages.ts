import { supabase } from './client';
import { Message } from '@/types';
import * as localMessages from '../database/messages';

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL &&
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
         process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co';
};

// Supabase table name for messages
const MESSAGES_TABLE = 'messages';

export const createMessage = async (messageData: Omit<Message, 'id' | 'created_at' | 'updated_at'>): Promise<Message> => {
  if (!isSupabaseConfigured()) {
    console.log('Using local database for message creation');
    return localMessages.createMessage(messageData);
  }

  try {
    const { data, error } = await supabase
      .from(MESSAGES_TABLE)
      .insert([{
        sender_id: messageData.sender_id,
        recipient_id: messageData.recipient_id,
        subject: messageData.subject,
        content: messageData.content,
        is_announcement: messageData.is_announcement,
        target_roles: messageData.target_roles,
        read_at: messageData.read_at,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Supabase message creation failed, falling back to local database:', error);
    return localMessages.createMessage(messageData);
  }
};

export const getAllMessages = async (): Promise<Message[]> => {
  const { data, error } = await supabase
    .from(MESSAGES_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data || [];
};

export const getMessagesByUser = async (userId: string): Promise<Message[]> => {
  if (!isSupabaseConfigured()) {
    console.log('Using local database for message retrieval');
    return localMessages.getMessagesByUser(userId);
  }

  try {
    // First, get the user's role to filter announcements properly
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user role:', userError);
    }

    const userRole = userData?.role;

    // Get messages where user is sender or recipient
    const { data: directMessages, error: directError } = await supabase
      .from(MESSAGES_TABLE)
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (directError) {
      console.error('Error fetching direct messages:', directError);
    }

    // Get announcements (either all announcements or role-specific ones)
    const { data: announcements, error: announcementError } = await supabase
      .from(MESSAGES_TABLE)
      .select('*')
      .eq('is_announcement', true)
      .order('created_at', { ascending: false });

    if (announcementError) {
      console.error('Error fetching announcements:', announcementError);
    }

    // Filter announcements based on target roles
    const filteredAnnouncements = (announcements || []).filter(announcement => {
      // If no target roles specified, show to everyone
      if (!announcement.target_roles || announcement.target_roles.length === 0) {
        return true;
      }
      // If user role matches target roles, show the announcement
      return userRole && announcement.target_roles.includes(userRole);
    });

    // Combine and sort all messages
    const allMessages = [...(directMessages || []), ...filteredAnnouncements];
    allMessages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return allMessages;
  } catch (error) {
    console.error('Supabase message retrieval failed, falling back to local database:', error);
    return localMessages.getMessagesByUser(userId);
  }
};

export const getMessagesByRecipient = async (recipientId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from(MESSAGES_TABLE)
    .select('*')
    .or(`recipient_id.eq.${recipientId},is_announcement.eq.true`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching messages by recipient:', error);
    return [];
  }

  return data || [];
};

export const getMessagesBySender = async (senderId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from(MESSAGES_TABLE)
    .select('*')
    .eq('sender_id', senderId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching messages by sender:', error);
    return [];
  }

  return data || [];
};

export const getMessageById = async (id: string): Promise<Message | null> => {
  const { data, error } = await supabase
    .from(MESSAGES_TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching message by ID:', error);
    return null;
  }

  return data;
};

export const updateMessage = async (id: string, updates: Partial<Omit<Message, 'id' | 'created_at'>>): Promise<Message | null> => {
  const { data, error } = await supabase
    .from(MESSAGES_TABLE)
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating message:', error);
    return null;
  }

  return data;
};

export const deleteMessage = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from(MESSAGES_TABLE)
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting message:', error);
    return false;
  }

  return true;
};

export const searchMessages = async (searchTerm: string, userId?: string): Promise<Message[]> => {
  let query = supabase
    .from(MESSAGES_TABLE)
    .select('*')
    .or(`subject.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);

  if (userId) {
    query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId},is_announcement.eq.true`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching messages:', error);
    return [];
  }

  return data || [];
};

export const getUnreadMessages = async (userId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from(MESSAGES_TABLE)
    .select('*')
    .or(`recipient_id.eq.${userId},is_announcement.eq.true`)
    .is('read_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching unread messages:', error);
    return [];
  }

  return data || [];
};

export const markMessageAsRead = async (messageId: string): Promise<Message | null> => {
  if (!isSupabaseConfigured()) {
    console.log('Using local database for marking message as read');
    return localMessages.markMessageAsRead(messageId) || null;
  }

  try {
    return await updateMessage(messageId, { read_at: new Date().toISOString() });
  } catch (error) {
    console.error('Supabase mark as read failed, falling back to local database:', error);
    return localMessages.markMessageAsRead(messageId) || null;
  }
};

// Real-time subscription for new messages
export const subscribeToMessages = (userId: string, callback: (message: Message) => void) => {
  try {
    return supabase
      .channel('messages')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: MESSAGES_TABLE,
          filter: `or(sender_id.eq.${userId},recipient_id.eq.${userId},is_announcement.eq.true)`
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();
  } catch (error) {
    console.error('Error setting up message subscription:', error);
    // Return a dummy subscription object
    return {
      unsubscribe: () => {}
    };
  }
};

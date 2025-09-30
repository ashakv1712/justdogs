'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { getCurrentUser } from '@/lib/auth/auth';
import { Message, User, UserRole } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { getAllUsers } from '@/lib/supabase/users';
import { createMessage, getMessagesByUser, subscribeToMessages, markMessageAsRead } from '@/lib/supabase/messages';

// Import getAllUsers directly from the database

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [formData, setFormData] = useState({
    recipient_id: '',
    subject: '',
    content: '',
    is_announcement: false,
    target_roles: [] as UserRole[]
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableRecipients, setAvailableRecipients] = useState<User[]>([]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        
        // Load user names first
        await loadUserNames();
        
        if (user) {
          // Load messages from Supabase based on user role
          try {
            const userMessages = await getMessagesByUser(user.id);
            setMessages(userMessages);
          } catch (messageError) {
            console.error('Error fetching messages by user:', messageError);
            // Fallback to empty array if Supabase fails
            setMessages([]);
          }
          
          // Load available recipients
          try {
            const recipients = await getAvailableRecipients();
            setAvailableRecipients(recipients);
          } catch (recipientError) {
            console.error('Error loading recipients:', recipientError);
            setAvailableRecipients([]);
          }
          
          // Subscribe to real-time message updates
          try {
            const subscription = subscribeToMessages(user.id, (newMessage) => {
              setMessages(prev => [newMessage, ...prev]);
            });
            
            // Cleanup subscription on unmount
            return () => {
              subscription.unsubscribe();
            };
          } catch (subscriptionError) {
            console.error('Error setting up message subscription:', subscriptionError);
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const filteredMessages = messages.filter(message =>
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unreadMessages = messages.filter(message => !message.read_at);
  const recentMessages = messages.slice(0, 5);

  const [userNames, setUserNames] = useState<{[key: string]: string}>({});

  const getSenderName = (senderId: string) => {
    return userNames[senderId] || 'Unknown User';
  };

  const getReceiverName = (receiverId?: string) => {
    if (!receiverId) return 'All Users';
    return userNames[receiverId] || 'Unknown User';
  };

  const loadUserNames = async () => {
    try {
      const allUsers = await getAllUsers();
      const nameMap: {[key: string]: string} = {};
      allUsers.forEach(user => {
        nameMap[user.id] = user.full_name;
      });
      setUserNames(nameMap);
    } catch (error) {
      console.error('Error loading user names:', error);
    }
  };

  const getMessageTypeColor = (isAnnouncement: boolean) => {
    if (isAnnouncement) {
      return 'bg-purple-100 text-purple-800';
    }
    return 'bg-[rgb(0_32_96)] text-white';
  };

  const handleInputChange = (field: string, value: string | boolean | UserRole[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;

    try {
      // Create message in Supabase
      const newMessage = await createMessage({
        sender_id: currentUser.id,
        recipient_id: formData.is_announcement ? undefined : formData.recipient_id,
        subject: formData.subject,
        content: formData.content,
        is_announcement: formData.is_announcement,
        target_roles: formData.is_announcement ? formData.target_roles : undefined,
      });

      // Update local state
      setMessages(prev => [newMessage, ...prev]);
      setFormData({
        recipient_id: '',
        subject: '',
        content: '',
        is_announcement: false,
        target_roles: [] as UserRole[]
      });
      setShowNewMessageModal(false);
      alert('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleMessageClick = async (message: Message) => {
    setSelectedMessage(message);
    
    // Mark message as read if it's unread and the current user is the recipient
    if (!message.read_at && currentUser &&
        (message.recipient_id === currentUser.id || message.is_announcement)) {
      try {
        await markMessageAsRead(message.id);
        // Update local state
        setMessages(prev => prev.map(m =>
          m.id === message.id ? { ...m, read_at: new Date().toISOString() } : m
        ));
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const getAvailableRecipients = useCallback(async () => {
    if (!currentUser) return [];
    
    try {
      const allUsers = await getAllUsers();
      console.log('All users from Supabase:', allUsers);
      console.log('Current user:', currentUser);
      
      // Filter out current user and show appropriate recipients based on role
      let recipients = allUsers.filter(user => 
        user.id !== currentUser.id && 
        (currentUser.role === 'admin' || 
         (currentUser.role === 'trainer' && (user.role === 'parent' || user.role === 'behaviorist')) ||
         (currentUser.role === 'parent' && (user.role === 'trainer' || user.role === 'behaviorist')) ||
         (currentUser.role === 'behaviorist' && (user.role === 'parent' || user.role === 'trainer')))
      );
      
      // If no recipients found with role-based filtering, show all other users (except current user)
      if (recipients.length === 0) {
        recipients = allUsers.filter(user => user.id !== currentUser.id);
        console.log('No role-based recipients found, showing all other users:', recipients);
      }
      
      console.log('Available recipients:', recipients);
      return recipients;
    } catch (error) {
      console.error('Error fetching recipients:', error);
      return [];
    }
  }, [currentUser]);

  // Debug: Show current users in database
  const debugUsers = async () => {
    try {
      const allUsers = await getAllUsers();
      console.log('=== DEBUG: All Users in Supabase ===');
      console.log('Total users:', allUsers.length);
      allUsers.forEach((user, index) => {
        console.log(`User ${index + 1}:`, {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        });
      });
      console.log('=== END DEBUG ===');
    } catch (error) {
      console.error('Error debugging users:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(0_32_96)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600">Communicate with trainers, parents, and staff</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Button 
            onClick={() => setShowNewMessageModal(true)}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Message
          </Button>
          <Button 
            onClick={debugUsers}
            variant="outline"
          >
            Debug Users
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search messages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <ChatBubbleLeftRightIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages.length}</div>
            <p className="text-xs text-muted-foreground">
              All messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadMessages.length}</div>
            <p className="text-xs text-muted-foreground">
              Messages to read
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent</CardTitle>
            <UserGroupIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentMessages.length}</div>
            <p className="text-xs text-muted-foreground">
              Last 5 messages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {filteredMessages.map((message) => (
          <Card 
            key={message.id} 
            className={`hover:shadow-md transition-shadow cursor-pointer ${
              !message.read_at ? 'border-[rgb(0_32_96)] border-opacity-20 bg-[rgb(0_32_96)] bg-opacity-5' : ''
            }`}
            onClick={() => handleMessageClick(message)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {!message.read_at && (
                      <div className="w-2 h-2 bg-[rgb(0_32_96)] rounded-full"></div>
                    )}
                    <h3 className="font-semibold text-lg">{message.subject}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMessageTypeColor(message.is_announcement)}`}>
                      {message.is_announcement ? 'Announcement' : 'Message'}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">From:</span> {getSenderName(message.sender_id)}
                      {!message.is_announcement && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="font-medium">To:</span> {getReceiverName(message.recipient_id)}
                        </>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDateTime(message.created_at)}
                    </p>
                  </div>

                  <p className="text-gray-700 line-clamp-2">
                    {message.content}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredMessages.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms.' : 'Start a conversation by sending your first message.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowNewMessageModal(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Send First Message
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">New Message</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewMessageModal(false)}
              >
                <XMarkIcon className="h-5 w-5" />
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Message Type */}
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="messageType"
                    checked={!formData.is_announcement}
                    onChange={() => handleInputChange('is_announcement', false)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-900">Direct Message</span>
                </label>
                {currentUser?.role === 'admin' && (
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="messageType"
                      checked={formData.is_announcement}
                      onChange={() => handleInputChange('is_announcement', true)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-900">Announcement</span>
                  </label>
                )}
              </div>

              {/* Recipient Selection */}
              {!formData.is_announcement && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To
                  </label>
                  <select
                    value={formData.recipient_id}
                    onChange={(e) => handleInputChange('recipient_id', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[rgb(0_32_96)] focus:border-transparent text-gray-900 bg-white"
                    required
                  >
                    <option value="">Select recipient...</option>
                    {availableRecipients.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Target Roles for Announcements */}
              {formData.is_announcement && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Roles (leave empty to send to all users)
                  </label>
                  <div className="space-y-2">
                    {(['parent', 'trainer', 'behaviorist'] as UserRole[]).map(role => (
                      <label key={role} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.target_roles.includes(role)}
                          onChange={(e) => {
                            const newRoles = e.target.checked
                              ? [...formData.target_roles, role]
                              : formData.target_roles.filter(r => r !== role);
                            handleInputChange('target_roles', newRoles);
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm capitalize text-gray-900">{role}s</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Select specific roles to target, or leave all unchecked to send to everyone.
                  </p>
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <Input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="Enter message subject..."
                  required
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[rgb(0_32_96)] focus:border-transparent min-h-[120px] resize-vertical text-gray-900 bg-white"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewMessageModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Send Message
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold text-gray-900">{selectedMessage.subject}</h2>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMessageTypeColor(selectedMessage.is_announcement)}`}>
                  {selectedMessage.is_announcement ? 'Announcement' : 'Message'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMessage(null)}
                className="hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">From:</span> {getSenderName(selectedMessage.sender_id)}
                  </p>
                  {!selectedMessage.is_announcement && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">To:</span> {getReceiverName(selectedMessage.recipient_id)}
                    </p>
                  )}
                  {selectedMessage.is_announcement && selectedMessage.target_roles && selectedMessage.target_roles.length > 0 && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Target Roles:</span> {selectedMessage.target_roles.join(', ')}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Sent:</span> {formatDateTime(selectedMessage.created_at)}
                  </p>
                  {selectedMessage.read_at && (
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Read:</span> {formatDateTime(selectedMessage.read_at)}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-2">Message Content:</h3>
                <div className="bg-white border rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.content}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedMessage(null)}
                >
                  Close
                </Button>
                {selectedMessage.sender_id !== currentUser?.id && (
                  <Button
                    onClick={() => {
                      setFormData({
                        recipient_id: selectedMessage.sender_id,
                        subject: `Re: ${selectedMessage.subject}`,
                        content: '',
                        is_announcement: false,
                        target_roles: []
                      });
                      setSelectedMessage(null);
                      setShowNewMessageModal(true);
                    }}
                  >
                    Reply
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

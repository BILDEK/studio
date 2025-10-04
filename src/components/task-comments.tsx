
"use client"

import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, File as FileIcon, Trash2 } from 'lucide-react';

// Data structures
export interface Comment {
  id: string;
  author: string;
  authorAvatar?: string;
  text: string;
  timestamp: Date;
}

export interface Attachment {
  id: string;
  fileName: string;
  url: string; // In a real app, this would be a URL to the stored file
  uploader: string;
  timestamp: Date;
}

interface TaskCommentsProps {
  taskId: string;
  initialComments?: Comment[];
  initialAttachments?: Attachment[];
  onAddComment: (commentText: string) => void;
  onFileUpload: (file: File) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  currentUser: { name: string, avatar?: string };
}

export function TaskComments({
  taskId,
  initialComments = [],
  initialAttachments = [],
  onAddComment,
  onFileUpload,
  onDeleteAttachment,
  currentUser
}: TaskCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddComment = () => {
    if (newComment.trim() === "") return;
    onAddComment(newComment.trim());
    setNewComment("");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  // Sort comments and attachments together by timestamp to create an activity feed
  const activityFeed = [
      ...initialComments.map(c => ({ ...c, type: 'comment' as const })),
      ...initialAttachments.map(a => ({ ...a, type: 'attachment' as const }))
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="space-y-3 pt-2">
      <h4 className="text-xs font-semibold text-muted-foreground">Activity</h4>
      
      {/* Comment Input */}
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={currentUser.avatar} />
          <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="w-full space-y-2">
            <Textarea 
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="text-sm"
                rows={2}
            />
            <div className="flex justify-between items-center">
                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="h-4 w-4" />
                    <span className="sr-only">Attach file</span>
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                    <Send className="h-4 w-4 mr-1"/> Comment
                </Button>
            </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
        {activityFeed.map(item => (
            item.type === 'comment' ? (
                <div key={item.id} className="flex items-start gap-3 text-sm">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={item.authorAvatar} />
                        <AvatarFallback>{item.author.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">{item.author}</span>
                            <span className="text-xs text-muted-foreground">{item.timestamp.toLocaleString()}</span>
                        </div>
                        <p className="text-foreground/90 whitespace-pre-wrap">{item.text}</p>
                    </div>
                </div>
            ) : (
                <div key={item.id} className="flex items-start gap-3 text-sm">
                     <Avatar className="h-8 w-8">
                        <AvatarImage src={/* find uploader avatar based on name? */ undefined} />
                        <AvatarFallback>{item.uploader.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                             <span className="font-semibold">{item.uploader}</span>
                            <span className="text-xs text-muted-foreground">added an attachment</span>
                        </div>
                         <div className="mt-1 flex items-center p-2 rounded-md border bg-muted/50 w-full">
                            <FileIcon className="h-6 w-6 mr-3 text-muted-foreground flex-shrink-0" />
                            <div className="flex-grow">
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline truncate">
                                    {item.fileName}
                                </a>
                            </div>
                             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDeleteAttachment(item.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    </div>
                </div>
            )
        ))}
      </div>
    </div>
  )
}

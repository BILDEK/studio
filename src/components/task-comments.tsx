
"use client"

import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, X, File as FileIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export interface Attachment {
  name: string;
  url: string;
  path: string;
  size: number;
}

export interface Comment {
  id: string;
  author: string;
  authorAvatar: string;
  timestamp: Date;
  text: string;
  attachments?: Attachment[];
}

interface TaskCommentsProps {
  taskId: string;
  initialComments?: Comment[];
  onAddComment: (commentText: string, attachments: Attachment[]) => void;
  currentUser: { name: string; avatar: string; };
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export function TaskComments({ taskId, initialComments = [], onAddComment, currentUser }: TaskCommentsProps) {
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setStagedFiles(prev => [...prev, ...Array.from(event.target.files as FileList)]);
    }
  };

  const removeStagedFile = (fileIndex: number) => {
    setStagedFiles(prev => prev.filter((_, index) => index !== fileIndex));
  };

  const handleCommentSubmit = async () => {
    if (commentText.trim() === "" && stagedFiles.length === 0) return;

    setIsSubmitting(true);
    let uploadedAttachments: Attachment[] = [];

    try {
      for (const file of stagedFiles) {
        const filePath = `tasks/${taskId}/comments/${Date.now()}-${file.name}`;
        const storageRef = ref(storage, filePath);
        const uploadResult = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(uploadResult.ref);
        uploadedAttachments.push({ name: file.name, url, path: filePath, size: file.size });
      }

      onAddComment(commentText, uploadedAttachments);

      setCommentText("");
      setStagedFiles([]);
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-4 pt-4">
        <h4 className="text-sm font-semibold text-muted-foreground">Activity</h4>
        
        <div className="flex items-start space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser.avatar} />
            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea 
              placeholder="Add a comment..." 
              value={commentText} 
              onChange={(e) => setCommentText(e.target.value)}
              className="mb-2"
              rows={2}
            />
            {stagedFiles.length > 0 && (
              <div className="mb-2 space-y-2">
                <p className='text-xs font-medium text-muted-foreground'>Attachments:</p>
                {stagedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 p-1.5 rounded-md">
                    <div className="flex items-center gap-2 min-w-0"> {/* Fix: Added min-w-0 */}
                      <FileIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate" title={file.name}>{file.name}</span>
                    </div>
                    <div className='flex items-center gap-2 flex-shrink-0'>
                      <span className='text-xs text-foreground/70'>{formatBytes(file.size)}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeStagedFile(index)}><X className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between items-center">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                            <Paperclip className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Attach files</p></TooltipContent>
                </Tooltip>
                <Button onClick={handleCommentSubmit} disabled={isSubmitting || (commentText.trim() === '' && stagedFiles.length === 0)}>
                {isSubmitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" /> : <Send className="h-4 w-4" />} <span className='ml-2'>Comment</span>
              </Button>
            </div>
          </div>
          <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        </div>

        <div className="space-y-5">
          {initialComments?.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).map(comment => (
            <div key={comment.id} className="flex items-start space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.authorAvatar} />
                <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0"> {/* Fix: Added min-w-0 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{comment.author}</span>
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}</span>
                </div>
                {comment.text && <p className="text-sm text-foreground/80 whitespace-pre-wrap">{comment.text}</p>}
                {comment.attachments && comment.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                        {comment.attachments.map(att => (
                            <a key={att.path} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 p-1.5 rounded-md hover:bg-muted transition-colors">
                               <div className="flex items-center gap-2 min-w-0"> {/* Fix: Added min-w-0 */}
                                    <FileIcon className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate hover:underline" title={att.name}>{att.name}</span>
                                </div>
                               <span className='ml-auto text-xs text-foreground/70 flex-shrink-0 pl-2'>{formatBytes(att.size)}</span>
                            </a>
                        ))}
                    </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

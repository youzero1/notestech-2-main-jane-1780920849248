import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Heart, Share2, MoreVertical, Pencil, Trash2, ImagePlus, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_AVATAR } from "./constants";
import { Post as PostType } from "./types";
import { formatDistanceToNowStrict } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MediaCarousel } from "./MediaCarousel";

interface PostProps {
  post: PostType;
  isAuthor: boolean;
  onLike: (postId: string) => void;
  onComment: () => void;
  onShare: () => void;
  onEdit: (postId: string, content: string, image: File | null, shouldRemoveImage: boolean) => Promise<void>;
  onDelete: (postId: string) => Promise<void>;
  isEditing: boolean;
  editContent: string;
  setEditContent: (content: string) => void;
  editImage: File | null;
  setEditImage: (image: File | null) => void;
  cancelEdit: () => void;
  newComment: string;
  onNewCommentChange: (value: string) => void;
  onAddComment: () => void;
}

export const Post = ({
  post,
  isAuthor,
  onLike,
  onComment,
  onShare,
  onEdit,
  onDelete,
  isEditing,
  editContent,
  setEditContent,
  editImage,
  setEditImage,
  cancelEdit,
  newComment,
  onNewCommentChange,
  onAddComment
}: PostProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size should be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setEditImage(file);
    }
  };

  const handleDeleteClick = () => {
    onDelete(post.id);
  };

  const handleSaveEdit = () => {
    onEdit(post.id, editContent, editImage, false);
  };

  const handleMediaClick = () => {
    fileInputRef.current?.click();
  };

  if (isEditing) {
    return (
      <Card className="p-4">
        <div className="space-y-4">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[100px] resize-none"
          />

          {editImage && (
            <div className="relative">
              <img
                src={URL.createObjectURL(editImage)}
                alt="Edit preview"
                className="rounded-lg max-h-96 w-full object-cover"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => setEditImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleMediaSelect}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMediaClick}
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              Add Image
            </Button>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={cancelEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={post.author?.avatar_url || DEFAULT_AVATAR}
            alt={post.author?.username || "User avatar"}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="font-medium">
              {post.author?.first_name} {post.author?.last_name}
            </p>
            <p className="text-sm text-gray-500">
              {formatDistanceToNowStrict(new Date(post.created_at))} ago
            </p>
          </div>
        </div>

        {isAuthor && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(post.id, "START_EDIT", null, false)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your post.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteClick}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="px-4 pb-4">
        <p className="whitespace-pre-wrap">{post.content}</p>
      </div>

      {post.media && post.media.length > 0 && (
        <MediaCarousel media={post.media} />
      )}

      <div className="p-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onLike(post.id)}
          className={post.liked_by_user ? "text-primary" : ""}
        >
          <Heart className={`h-5 w-5 mr-2 ${post.liked_by_user ? "fill-primary" : ""}`} />
          {post.likes}
        </Button>
        <Button variant="ghost" size="sm" onClick={onComment}>
          <MessageSquare className="h-5 w-5 mr-2" />
          {post.comments}
        </Button>
        <Button variant="ghost" size="sm" onClick={onShare}>
          <Share2 className="h-5 w-5 mr-2" />
          {post.shares}
        </Button>
      </div>

      {post.showComments && (
        <div className="px-4 pb-4 space-y-4">
          <div className="flex gap-2">
            <textarea
              value={newComment}
              onChange={(e) => onNewCommentChange(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 min-h-[60px] bg-background p-2 rounded-md border border-gray-300 resize-none"
            />
            <Button onClick={onAddComment}>Post</Button>
          </div>

          {post.commentsList?.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <img
                src={comment.author?.avatar_url || DEFAULT_AVATAR}
                alt={comment.author?.username || "User avatar"}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <p className="font-medium">
                  {comment.author?.first_name} {comment.author?.last_name}
                </p>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

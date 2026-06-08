
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Facebook, Twitter, MessageCircle, Ghost, Copy } from "lucide-react";
import { Post } from "./types";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post | null;
  onShare: (platform: string, post: Post) => void;
  onCopy: (url: string) => void;
}

export const ShareDialog = ({ 
  open, 
  onOpenChange, 
  post, 
  onShare,
  onCopy 
}: ShareDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Post</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center items-center gap-2 py-4">
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full h-10 w-10"
            onClick={() => post && onShare('facebook', post)}
          >
            <Facebook className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full h-10 w-10"
            onClick={() => post && onShare('twitter', post)}
          >
            <Twitter className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full h-10 w-10"
            onClick={() => post && onShare('whatsapp', post)}
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full h-10 w-10"
            onClick={() => post && onShare('snapchat', post)}
          >
            <Ghost className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full h-10 w-10"
            onClick={() => {
              if (post) {
                const postUrl = `${window.location.origin}/view-post?id=${post.id}`;
                onCopy(postUrl);
              }
            }}
          >
            <Copy className="h-5 w-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

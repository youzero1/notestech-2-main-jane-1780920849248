
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface ProjectRequestDialogProps {
  projectId: string;
  projectTitle: string;
}

export const ProjectRequestDialog = ({ projectId, projectTitle }: ProjectRequestDialogProps) => {
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmitRequest = async () => {
    if (!message.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('collaboration_requests')
        .insert({
          project_id: projectId,
          sender_id: user.id,
          message: message,
          status: 'pending'
        });

      if (error) throw error;

      setMessage("");
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Request sent",
        description: "Your collaboration request has been sent successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send request. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Request to Join</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Project: {projectTitle}</DialogTitle>
          <DialogDescription>
            Send a message to the project creator explaining why you'd like to join.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your message here..."
          className="min-h-[100px]"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmitRequest}>Send Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

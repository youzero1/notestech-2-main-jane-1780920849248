import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface NoteslinkSetupProps {
  onProfileCreated: (profile: any) => void;
}

export function NoteslinkSetup({ onProfileCreated }: NoteslinkSetupProps) {
  const { user } = useAuth();
  const [slug, setSlug] = useState('');
  const [bio, setBio] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [creationStep, setCreationStep] = useState<'idle' | 'validating' | 'creating' | 'success'>('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    console.log('[NoteslinkSetup] Component mounted', { userId: user?.id });
  }, [user]);

  const checkSlugAvailability = async (slugToCheck: string) => {
    if (!slugToCheck || slugToCheck.length < 3) {
      setSlugAvailable(null);
      return;
    }

    setIsCheckingSlug(true);
    console.log('[NoteslinkSetup] Checking slug availability:', slugToCheck);

    try {
      const { data, error } = await supabase
        .from('noteslink_profiles')
        .select('id')
        .eq('slug', slugToCheck.toLowerCase())
        .maybeSingle();

      if (error) {
        console.error('[NoteslinkSetup] Error checking slug:', error);
        toast.error('Failed to check username availability');
        setSlugAvailable(null);
        return;
      }

      const available = !data;
      setSlugAvailable(available);
      console.log('[NoteslinkSetup] Slug availability result:', { slug: slugToCheck, available });
      
      if (available) {
        toast.success('Username is available!');
      }
    } catch (error) {
      console.error('[NoteslinkSetup] Exception checking slug:', error);
      toast.error('Failed to check username availability');
      setSlugAvailable(null);
    } finally {
      setIsCheckingSlug(false);
    }
  };

  const handleSlugChange = (value: string) => {
    // Only allow alphanumeric and hyphens
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(sanitized);
    checkSlugAvailability(sanitized);
  };

  const handleCreateProfile = async () => {
    if (!user || !slug) {
      console.error('[NoteslinkSetup] Missing user or slug', { user: !!user, slug });
      toast.error('Please complete all required fields');
      return;
    }

    if (slug.length < 3) {
      console.warn('[NoteslinkSetup] Slug too short:', slug.length);
      toast.error('Username must be at least 3 characters');
      return;
    }

    if (!slugAvailable) {
      console.warn('[NoteslinkSetup] Slug not available:', slug);
      toast.error('This username is already taken');
      return;
    }

    console.log('[NoteslinkSetup] Starting profile creation:', { userId: user.id, slug });
    setIsCreating(true);
    setCreationStep('validating');
    setProgress(20);

    try {
      // Step 1: Final validation
      toast.loading('Validating username...', { id: 'creation' });
      await new Promise(resolve => setTimeout(resolve, 300));
      setProgress(40);
      setCreationStep('creating');

      // Step 2: Create profile
      console.log('[NoteslinkSetup] Inserting profile into database');
      toast.loading('Creating your Noteslink...', { id: 'creation' });
      
      const { data, error } = await supabase
        .from('noteslink_profiles')
        .insert({
          profile_id: user.id,
          slug: slug.toLowerCase(),
          custom_bio: bio || null,
          is_public: true,
          theme_color: '#D4AF37',
          background_type: 'solid',
          background_value: '#000000'
        })
        .select()
        .single();

      if (error) {
        console.error('[NoteslinkSetup] Database error:', error);
        throw error;
      }

      console.log('[NoteslinkSetup] Profile created successfully:', data);
      setProgress(100);
      setCreationStep('success');

      toast.success('🎉 Your Noteslink is ready!', { 
        id: 'creation',
        duration: 3000 
      });

      // Small delay to show success state
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onProfileCreated(data);
    } catch (error: any) {
      console.error('[NoteslinkSetup] Error creating Noteslink profile:', error);
      setCreationStep('idle');
      setProgress(0);
      
      let errorMessage = 'Failed to create Noteslink';
      
      if (error.code === '23505') {
        errorMessage = 'This username is already taken';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: 'creation' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Vinyl record background effect */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-96 h-96 rounded-full border-[40px] border-current animate-[spin_20s_linear_infinite]" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full border-[30px] border-current animate-[spin_15s_linear_infinite_reverse]" />
      </div>

      <Card className="max-w-md w-full p-8 relative backdrop-blur-sm bg-card/95 shadow-[0_20px_60px_-20px_hsl(var(--vinyl-black)/0.6)]">
        <div className="text-center mb-8">
          <div className="inline-block mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--noteslink-gold))] to-[hsl(var(--mic-gold))] blur-xl opacity-50" />
            <h1 className="text-4xl font-bebas tracking-wider mb-2 relative bg-gradient-to-r from-[hsl(var(--noteslink-gold))] to-[hsl(var(--mic-gold))] bg-clip-text text-transparent">
              CREATE YOUR STAGE
            </h1>
          </div>
          <p className="text-muted-foreground font-inter">
            Your digital spotlight awaits
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="slug">Choose Your Username</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">notes.com/</span>
              <div className="relative flex-1">
                <Input
                  id="slug"
                  placeholder="username"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  disabled={isCreating}
                  className={
                    slugAvailable === true ? 'border-green-500 pr-10' :
                    slugAvailable === false ? 'border-red-500 pr-10' : 'pr-10'
                  }
                />
                {isCheckingSlug && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {!isCheckingSlug && slugAvailable === true && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
                )}
                {!isCheckingSlug && slugAvailable === false && (
                  <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-600" />
                )}
              </div>
            </div>
            {slug.length > 0 && slug.length < 3 && (
              <div className="flex items-center gap-1 text-sm text-amber-600">
                <AlertCircle className="h-3 w-3" />
                <span>Username must be at least 3 characters</span>
              </div>
            )}
            {slug.length >= 3 && !isCheckingSlug && (
              <div className={`flex items-center gap-1 text-sm ${slugAvailable ? 'text-green-600' : 'text-red-600'}`}>
                {slugAvailable ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                <span>{slugAvailable ? 'Username is available!' : 'Username is already taken'}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio (Optional)</Label>
            <Textarea
              id="bio"
              placeholder="Tell people about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              disabled={isCreating}
            />
          </div>

          {isCreating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {creationStep === 'validating' && 'Validating username...'}
                  {creationStep === 'creating' && 'Creating your Noteslink...'}
                  {creationStep === 'success' && 'Success!'}
                </span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <Button
            onClick={handleCreateProfile}
            disabled={!slug || !slugAvailable || isCreating}
            className="w-full relative overflow-hidden group bg-gradient-to-r from-[hsl(var(--noteslink-gold))] to-[hsl(var(--mic-gold))] hover:shadow-[0_0_20px_hsl(var(--noteslink-gold)/0.3)] transition-all duration-300"
          >
            <span className="relative z-10 flex items-center justify-center font-bebas tracking-wider text-lg">
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {creationStep === 'success' ? '✨ STAGE READY!' : '🎤 CLAIM YOUR STAGE'}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--mic-gold))] to-[hsl(var(--noteslink-gold))] opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>

          {!isCreating && (
            <p className="text-xs text-center text-muted-foreground">
              After creating, you'll be able to customize your page with links, themes, and more
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

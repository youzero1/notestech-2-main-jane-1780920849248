import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Copy, 
  Download, 
  ExternalLink, 
  Share2,
  Twitter,
  Facebook,
  MessageCircle,
  Code2,
  QrCode
} from 'lucide-react';

interface NoteslinkPublishProps {
  profileSlug: string;
}

export function NoteslinkPublish({ profileSlug }: NoteslinkPublishProps) {
  // Use production domain
  const publicUrl = `https://notes.unstucklabs.app/${profileSlug}`;
  const embedCode = `<iframe src="${publicUrl}" width="100%" height="600" frameborder="0" title="Notes Link"></iframe>`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('noteslink-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `${profileSlug}-qr-code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();

      toast.success('QR code downloaded!');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const shareToSocial = (platform: 'twitter' | 'facebook' | 'whatsapp') => {
    const text = `Check out my Notes link: ${publicUrl}`;
    let url = '';

    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        break;
    }

    window.open(url, '_blank', 'width=600,height=400');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-[hsl(var(--noteslink-gold))]/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-[hsl(var(--noteslink-gold))]/10 border border-[hsl(var(--noteslink-gold))]/30">
            <Share2 className="h-6 w-6 text-[hsl(var(--noteslink-gold))]" />
          </div>
          <div>
            <h2 className="text-2xl font-bebas tracking-wider text-foreground">
              Share Your Notes Link
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Get your link out there with QR codes, embed codes, and social sharing
            </p>
          </div>
        </div>
      </Card>

      {/* Direct Link */}
      <Card className="p-6">
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-base font-semibold">
            <ExternalLink className="h-4 w-4" />
            Your Public Link
          </Label>
          <div className="flex gap-2">
            <Input 
              value={publicUrl} 
              readOnly 
              className="font-mono text-sm"
            />
            <Button 
              onClick={() => copyToClipboard(publicUrl, 'Link')}
              variant="outline"
              className="shrink-0"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button 
              onClick={() => window.open(publicUrl, '_blank')}
              variant="outline"
              className="shrink-0"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit
            </Button>
          </div>
        </div>
      </Card>

      {/* QR Code */}
      <Card className="p-6">
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-base font-semibold">
            <QrCode className="h-4 w-4" />
            QR Code
          </Label>
          <p className="text-sm text-muted-foreground">
            Download and share your QR code on flyers, business cards, or social media
          </p>
          
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="p-6 bg-white rounded-lg border-2 border-dashed border-border">
              <QRCodeSVG
                id="noteslink-qr-code"
                value={publicUrl}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            
            <div className="flex-1 space-y-3">
              <Button 
                onClick={downloadQRCode}
                className="w-full md:w-auto"
                variant="default"
              >
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
              <p className="text-xs text-muted-foreground">
                PNG format • High resolution • Perfect for printing
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Embed Code */}
      <Card className="p-6">
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-base font-semibold">
            <Code2 className="h-4 w-4" />
            Embed Code
          </Label>
          <p className="text-sm text-muted-foreground mb-3">
            Add your Notes link to any website with this iframe code
          </p>
          <div className="flex gap-2">
            <Input 
              value={embedCode} 
              readOnly 
              className="font-mono text-xs"
            />
            <Button 
              onClick={() => copyToClipboard(embedCode, 'Embed code')}
              variant="outline"
              className="shrink-0"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
          <div className="bg-muted/50 p-3 rounded-md border border-border/50">
            <p className="text-xs text-muted-foreground">
              <strong>Preview:</strong> This will display your Notes link in a 600px tall frame. 
              Customize the width and height attributes as needed.
            </p>
          </div>
        </div>
      </Card>

      {/* Social Sharing */}
      <Card className="p-6">
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-base font-semibold">
            <Share2 className="h-4 w-4" />
            Share on Social Media
          </Label>
          <p className="text-sm text-muted-foreground">
            Share your Notes link directly to your favorite platforms
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button 
              onClick={() => shareToSocial('twitter')}
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-4"
            >
              <div className="p-2 rounded-full bg-[#1DA1F2]/10">
                <Twitter className="h-5 w-5 text-[#1DA1F2]" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Twitter</div>
                <div className="text-xs text-muted-foreground">Share to X</div>
              </div>
            </Button>

            <Button 
              onClick={() => shareToSocial('facebook')}
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-4"
            >
              <div className="p-2 rounded-full bg-[#1877F2]/10">
                <Facebook className="h-5 w-5 text-[#1877F2]" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Facebook</div>
                <div className="text-xs text-muted-foreground">Post to feed</div>
              </div>
            </Button>

            <Button 
              onClick={() => shareToSocial('whatsapp')}
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-4"
            >
              <div className="p-2 rounded-full bg-[#25D366]/10">
                <MessageCircle className="h-5 w-5 text-[#25D366]" />
              </div>
              <div className="text-left">
                <div className="font-semibold">WhatsApp</div>
                <div className="text-xs text-muted-foreground">Send message</div>
              </div>
            </Button>
          </div>
        </div>
      </Card>

      {/* Tips Section */}
      <Card className="p-6 bg-muted/50 border-dashed">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <span className="text-[hsl(var(--noteslink-gold))]">💡</span>
          Promotion Tips
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-[hsl(var(--noteslink-gold))]">•</span>
            Add your QR code to your album artwork and merch
          </li>
          <li className="flex gap-2">
            <span className="text-[hsl(var(--noteslink-gold))]">•</span>
            Include your link in your social media bios and posts
          </li>
          <li className="flex gap-2">
            <span className="text-[hsl(var(--noteslink-gold))]">•</span>
            Embed it on your official website or EPK
          </li>
          <li className="flex gap-2">
            <span className="text-[hsl(var(--noteslink-gold))]">•</span>
            Share it in your email signature and newsletters
          </li>
        </ul>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import {
  MessageSquare,
  Video,
  Mic,
  Phone,
  Send,
  ClipboardList,
  X,
  ArrowLeft,
  MicOff,
  PhoneOff,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type ActiveChannel = null | 'chat' | 'video' | 'voice' | 'callback' | 'sms' | 'form';

const PRIMARY = '#8b5cf6';
const ORG_NAME = 'Cage Automotive';

const channels = [
  { id: 'chat' as const, icon: MessageSquare, label: 'Chat Now', desc: 'AI-powered text chat' },
  { id: 'video' as const, icon: Video, label: 'Live Video', desc: 'Face-to-face video call' },
  { id: 'voice' as const, icon: Mic, label: 'Web Call', desc: 'Talk now in browser' },
  { id: 'callback' as const, icon: Phone, label: 'Call Me Now', desc: 'We\'ll call you back' },
  { id: 'sms' as const, icon: Send, label: 'Receive a Text', desc: 'Get a text from us' },
  { id: 'form' as const, icon: ClipboardList, label: 'Contact Form', desc: 'Send us a message' },
];

export default function WidgetLandingPage() {
  const [active, setActive] = useState<ActiveChannel>(null);
  const [chatMessages, setChatMessages] = useState<{ role: 'bot' | 'user'; text: string }[]>([
    { role: 'bot', text: 'Welcome to Cage Automotive! How can I help you today?' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [
      ...prev,
      { role: 'user' as const, text: chatInput },
    ]);
    setChatInput('');
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { role: 'bot' as const, text: 'Thanks for reaching out! I\'d be happy to help you find the perfect vehicle. What type of car are you interested in?' },
      ]);
    }, 1200);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  const renderChannelView = () => {
    switch (active) {
      case 'chat':
        return (
          <div className="flex flex-col h-[500px] max-h-[60vh] rounded-2xl border border-border overflow-hidden bg-background" data-testid="channel-chat-view">
            <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: PRIMARY }}>
              <button onClick={() => setActive(null)} className="text-white/80 hover:text-white"><ArrowLeft className="h-4 w-4" /></button>
              <span className="text-white font-semibold text-sm flex-1">Chat with {ORG_NAME}</span>
              <button onClick={() => setActive(null)} className="text-white/80 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, i) => (
                <div key={i} className={cn('max-w-[80%]', msg.role === 'user' ? 'ml-auto' : '')}>
                  <div className={cn(
                    'px-3 py-2 rounded-xl text-sm',
                    msg.role === 'user' ? 'text-white rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'
                  )} style={msg.role === 'user' ? { backgroundColor: PRIMARY } : undefined}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-border flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                placeholder="Type a message..."
                className="flex-1"
                data-testid="input-chat-message"
              />
              <Button size="icon" onClick={handleChatSend} style={{ backgroundColor: PRIMARY }} data-testid="button-chat-send">
                <Send className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="rounded-2xl border border-border overflow-hidden bg-background" data-testid="channel-video-view">
            <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: PRIMARY }}>
              <button onClick={() => setActive(null)} className="text-white/80 hover:text-white"><ArrowLeft className="h-4 w-4" /></button>
              <span className="text-white font-semibold text-sm flex-1">Video Chat</span>
              <button onClick={() => setActive(null)} className="text-white/80 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="aspect-video bg-gray-900 relative flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-purple-600/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Video className="h-10 w-10 text-purple-400" />
                </div>
                <p className="text-white font-medium">Connecting to Sarah (AI Concierge)...</p>
                <p className="text-white/60 text-sm mt-1">Please allow camera and microphone access</p>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <Mic className="h-5 w-5 text-white" />
                </button>
                <button className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors" onClick={() => setActive(null)}>
                  <PhoneOff className="h-5 w-5 text-white" />
                </button>
                <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <Video className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        );

      case 'voice':
        return (
          <div className="rounded-2xl border border-border overflow-hidden bg-background" data-testid="channel-voice-view">
            <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: PRIMARY }}>
              <button onClick={() => setActive(null)} className="text-white/80 hover:text-white"><ArrowLeft className="h-4 w-4" /></button>
              <span className="text-white font-semibold text-sm flex-1">Voice Call</span>
              <button onClick={() => setActive(null)} className="text-white/80 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-8 text-center">
              {!voiceActive ? (
                <div>
                  <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                    <Mic className="h-12 w-12 text-emerald-600" />
                  </div>
                  <p className="font-semibold text-foreground">Ready to connect</p>
                  <p className="text-sm text-muted-foreground mt-1">Click below to start a voice call with our AI assistant</p>
                  <Button className="mt-4" style={{ backgroundColor: '#10b981' }} onClick={() => setVoiceActive(true)} data-testid="button-start-voice">
                    <Mic className="h-4 w-4 mr-2 text-white" />
                    <span className="text-white">Start Call</span>
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4 relative">
                    <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
                    <Mic className="h-12 w-12 text-emerald-500" />
                  </div>
                  <p className="font-semibold text-foreground">Call in progress</p>
                  <p className="text-sm text-muted-foreground mt-1">0:42</p>
                  <div className="flex gap-3 justify-center mt-4">
                    <button
                      className={cn('w-12 h-12 rounded-full flex items-center justify-center transition-colors', voiceMuted ? 'bg-red-500/20' : 'bg-muted hover:bg-muted/80')}
                      onClick={() => setVoiceMuted(!voiceMuted)}
                    >
                      {voiceMuted ? <MicOff className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5 text-foreground" />}
                    </button>
                    <button className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors" onClick={() => { setVoiceActive(false); setActive(null); }}>
                      <PhoneOff className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'callback':
      case 'sms':
      case 'form':
        const formConfig = {
          callback: { title: 'Request a Callback', btnText: 'Request Call', showTime: true, showMessage: false },
          sms: { title: 'Receive a Text', btnText: 'Send Me a Text', showTime: false, showMessage: true },
          form: { title: 'Contact Us', btnText: 'Send Message', showTime: false, showMessage: true },
        }[active];
        return (
          <div className="rounded-2xl border border-border overflow-hidden bg-background" data-testid={`channel-${active}-view`}>
            <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: PRIMARY }}>
              <button onClick={() => { setActive(null); setFormSubmitted(false); }} className="text-white/80 hover:text-white"><ArrowLeft className="h-4 w-4" /></button>
              <span className="text-white font-semibold text-sm flex-1">{formConfig.title}</span>
              <button onClick={() => { setActive(null); setFormSubmitted(false); }} className="text-white/80 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6">
              {formSubmitted ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                  <p className="font-semibold text-foreground text-lg">Thank you!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {active === 'callback' ? 'We\'ll call you back shortly.' : active === 'sms' ? 'You\'ll receive a text message soon.' : 'Your message has been sent. We\'ll be in touch!'}
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => { setActive(null); setFormSubmitted(false); }}>
                    Back to Options
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-3">
                  <div>
                    <Label className="text-xs">Full Name</Label>
                    <Input placeholder="John Smith" className="mt-1" required data-testid="input-form-name" />
                  </div>
                  {active === 'form' && (
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input type="email" placeholder="john@example.com" className="mt-1" required data-testid="input-form-email" />
                    </div>
                  )}
                  <div>
                    <Label className="text-xs">Phone Number</Label>
                    <Input type="tel" placeholder="(555) 123-4567" className="mt-1" required data-testid="input-form-phone" />
                  </div>
                  {formConfig.showTime && (
                    <div>
                      <Label className="text-xs">Preferred Time</Label>
                      <Input type="text" placeholder="e.g. Today after 2pm" className="mt-1" data-testid="input-form-time" />
                    </div>
                  )}
                  {formConfig.showMessage && (
                    <div>
                      <Label className="text-xs">{active === 'sms' ? 'Message (optional)' : active === 'form' ? 'How can we help?' : 'Message'}</Label>
                      <Textarea placeholder="Tell us what you're looking for..." rows={3} className="mt-1" data-testid="input-form-message" />
                    </div>
                  )}
                  {active === 'form' && (
                    <div>
                      <Label className="text-xs">Vehicle Interest (optional)</Label>
                      <Input placeholder="e.g. 2026 Toyota Camry, SUV under $40K" className="mt-1" data-testid="input-form-vehicle" />
                    </div>
                  )}
                  <Button type="submit" className="w-full text-white" style={{ backgroundColor: PRIMARY }} data-testid="button-form-submit">
                    {formConfig.btnText}
                  </Button>
                </form>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#faf5ff' }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: PRIMARY }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg">{ORG_NAME}</span>
        </div>
        <span className="text-white/60 text-xs">Powered by Nexxus</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {active ? (
          <div className="max-w-lg mx-auto">
            {renderChannelView()}
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Welcome to {ORG_NAME}</h1>
              <p className="text-gray-600 mt-2 text-lg">Choose how you'd like to connect with us</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {channels.map((ch) => {
                const Icon = ch.icon;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActive(ch.id)}
                    className="group bg-white rounded-2xl border border-gray-200 p-6 text-left hover:shadow-lg hover:border-purple-300 transition-all duration-200 hover:-translate-y-0.5"
                    data-testid={`landing-channel-${ch.id}`}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: PRIMARY + '15' }}>
                      <Icon className="h-6 w-6" style={{ color: PRIMARY }} />
                    </div>
                    <h3 className="font-semibold text-gray-900">{ch.label}</h3>
                    <p className="text-sm text-gray-500 mt-1">{ch.desc}</p>
                    <div className="mt-3">
                      <span className="text-sm font-medium" style={{ color: PRIMARY }}>Start &rarr;</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-2xl mx-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Contact Us</h2>
              <p className="text-gray-500 text-sm mb-6">Fill out the form below and we'll get back to you</p>
              {formSubmitted ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                  <p className="font-semibold text-gray-900">Message sent!</p>
                  <p className="text-sm text-gray-500 mt-1">We'll be in touch shortly.</p>
                  <Button variant="outline" className="mt-3" onClick={() => setFormSubmitted(false)}>Send Another</Button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-600">Full Name</Label>
                      <Input placeholder="John Smith" className="mt-1" required data-testid="input-landing-name" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Email</Label>
                      <Input type="email" placeholder="john@example.com" className="mt-1" required data-testid="input-landing-email" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-600">Phone</Label>
                      <Input type="tel" placeholder="(555) 123-4567" className="mt-1" data-testid="input-landing-phone" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Vehicle Interest</Label>
                      <Input placeholder="e.g. SUV under $40K" className="mt-1" data-testid="input-landing-vehicle" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">How can we help?</Label>
                    <Textarea placeholder="Tell us what you're looking for..." rows={3} className="mt-1" data-testid="input-landing-message" />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" className="text-white" style={{ backgroundColor: PRIMARY }} data-testid="button-landing-submit">
                      Send Message
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setActive('video')} data-testid="button-launch-video">
                      <Video className="h-4 w-4 mr-2" />
                      Launch Live Video Chat
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>

      <div className="text-center py-6 border-t border-gray-200 mt-8">
        <span className="text-xs text-gray-400">Powered by <strong>Nexxus</strong> &middot; AI-Powered Customer Engagement</span>
      </div>
    </div>
  );
}

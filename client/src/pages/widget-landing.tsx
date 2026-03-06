import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import {
  MessageSquare,
  Car,
  CheckCircle2,
  ArrowRight,
  Video,
  Phone,
  Send,
  X,
  Mic,
  MicOff,
  VideoOff,
  Loader2,
} from 'lucide-react';
const liveVideoImg = '/images/live-video-audience.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const GUNMETAL_BLUE = '#2c3e50';
const WIDGET_TEAL = '#0d9488';

interface LandingPageOrg {
  id: string;
  name: string;
  slug: string;
  personaName: string;
}

type WidgetMode = 'closed' | 'chat' | 'video' | 'voice' | 'form' | 'menu';

export default function WidgetLandingPage() {
  const [, params] = useRoute('/p/:slug');
  const slug = params?.slug || 'demo';

  const [orgData, setOrgData] = useState<LandingPageOrg | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug === 'demo') {
      setOrgData({ id: 'demo', name: 'Cage Automotive', slug: 'demo', personaName: 'Serra' });
      setLoading(false);
      return;
    }
    fetch(`/api/public/landing/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then(data => {
        if (data.redirect && data.newSlug) {
          window.location.href = `/p/${data.newSlug}`;
          return;
        }
        setOrgData(data);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  const ORG_NAME = orgData?.name || 'Cage Automotive';
  const PERSONA_NAME = orgData?.personaName || 'Serra';

  const [submitted, setSubmitted] = useState(false);
  const [widgetMode, setWidgetMode] = useState<WidgetMode>('closed');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [videoActive, setVideoActive] = useState(false);
  const [micMuted, setMicMuted] = useState(false);

  useEffect(() => {
    if (orgData) {
      setChatMessages([{ role: 'ai', text: `Hi! I'm ${orgData.personaName}, your AI concierge at ${orgData.name}. How can I help you today?` }]);
    }
  }, [orgData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-500">This dealership landing page doesn't exist.</p>
        </div>
      </div>
    );
  }

  const startVideoChat = () => {
    setWidgetMode('video');
    setVideoActive(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { role: 'user', text: chatInput }]);
    const userMsg = chatInput;
    setChatInput('');
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        role: 'ai',
        text: userMsg.toLowerCase().includes('suv')
          ? `Great choice! We have several SUVs in stock. Our most popular right now is the 2026 Explorer — would you like to schedule a test drive?`
          : userMsg.toLowerCase().includes('trade')
          ? `I can help with a trade-in estimate! What year, make, and model is your current vehicle?`
          : `I'd be happy to help with that! Let me look into it for you. Is there anything specific you'd like to know?`
      }]);
    }, 1200);
  };

  const renderWidgetContent = () => {
    if (widgetMode === 'menu') {
      return (
        <div className="bg-white rounded-2xl shadow-2xl w-80 overflow-hidden border border-gray-100" data-testid="widget-menu">
          <div className="p-4 text-white" style={{ backgroundColor: WIDGET_TEAL }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{ORG_NAME}</p>
                  <p className="text-white/70 text-xs">Choose how to connect</p>
                </div>
              </div>
              <button onClick={() => setWidgetMode('closed')} className="text-white/70 hover:text-white" data-testid="button-close-widget">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="p-3 space-y-2">
            <button
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left border border-gray-100"
              onClick={() => setWidgetMode('chat')}
              data-testid="widget-option-chat"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">Web Chat</p>
                <p className="text-xs text-gray-500">Chat with our AI assistant</p>
              </div>
            </button>
            <button
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left border border-gray-100"
              onClick={() => setWidgetMode('voice')}
              data-testid="widget-option-voice"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Phone className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">Web Call</p>
                <p className="text-xs text-gray-500">Talk to our AI assistant</p>
              </div>
            </button>
            <button
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left border border-gray-100"
              onClick={() => setWidgetMode('form')}
              data-testid="widget-option-form"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Send className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">Contact Form</p>
                <p className="text-xs text-gray-500">Send us a message</p>
              </div>
            </button>
            <button
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left border border-gray-100"
              onClick={startVideoChat}
              data-testid="widget-option-video"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Video className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">Two-Way Video</p>
                <p className="text-xs text-gray-500">Face-to-face with {PERSONA_NAME}</p>
              </div>
            </button>
          </div>
        </div>
      );
    }

    if (widgetMode === 'chat') {
      return (
        <div className="bg-white rounded-2xl shadow-2xl w-80 h-[420px] flex flex-col overflow-hidden border border-gray-100" data-testid="widget-chat">
          <div className="p-3 text-white flex items-center justify-between" style={{ backgroundColor: WIDGET_TEAL }}>
            <div className="flex items-center gap-2">
              <button onClick={() => setWidgetMode('menu')} className="text-white/70 hover:text-white text-xs" data-testid="button-back-menu">
                ←
              </button>
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <MessageSquare className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-xs">{PERSONA_NAME}</p>
                <p className="text-white/60 text-[10px]">Online now</p>
              </div>
            </div>
            <button onClick={() => setWidgetMode('closed')} className="text-white/70 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}
                  style={msg.role === 'user' ? { backgroundColor: WIDGET_TEAL } : undefined}
                  data-testid={`chat-message-${i}`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 text-sm h-9 px-3 rounded-md border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                data-testid="input-widget-chat"
              />
              <Button
                size="sm"
                className="h-9 w-9 p-0 text-white flex-shrink-0"
                style={{ backgroundColor: WIDGET_TEAL }}
                onClick={handleChatSend}
                data-testid="button-widget-send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (widgetMode === 'video') {
      return (
        <div className="bg-white rounded-2xl shadow-2xl w-80 h-[420px] flex flex-col overflow-hidden border border-gray-100" data-testid="widget-video">
          <div className="flex-1 bg-gray-900 relative flex items-center justify-center">
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
              <button onClick={() => setWidgetMode('menu')} className="text-white/70 hover:text-white bg-black/30 rounded-full p-1.5 text-xs" data-testid="button-video-back">
                ←
              </button>
              <button onClick={() => { setWidgetMode('closed'); setVideoActive(false); }} className="text-white/70 hover:text-white bg-black/30 rounded-full p-1.5" data-testid="button-video-close">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {videoActive ? (
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-teal-500 mx-auto mb-4 flex items-center justify-center animate-pulse">
                  <Video className="h-10 w-10 text-white" />
                </div>
                <p className="text-white font-medium text-sm">{PERSONA_NAME}</p>
                <p className="text-white/60 text-xs mt-1">AI Video Concierge</p>
                <p className="text-emerald-400 text-xs mt-2 flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Connected
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gray-800 mx-auto mb-4 flex items-center justify-center">
                  <Video className="h-10 w-10 text-gray-600" />
                </div>
                <p className="text-gray-400 text-sm">Connecting to {PERSONA_NAME}...</p>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <div className="absolute top-[-60px] right-3 w-16 h-20 rounded-lg bg-gray-700 border border-gray-600 flex items-center justify-center overflow-hidden">
                <p className="text-gray-500 text-[8px]">You</p>
              </div>
            </div>
          </div>
          <div className="p-3 bg-gray-900 border-t border-gray-800 flex items-center justify-center gap-4">
            <button
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${micMuted ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
              onClick={() => setMicMuted(!micMuted)}
              data-testid="button-toggle-mic"
            >
              {micMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <button
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${!videoActive ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
              onClick={() => setVideoActive(!videoActive)}
              data-testid="button-toggle-video"
            >
              {videoActive ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </button>
            <button
              className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
              onClick={() => { setWidgetMode('closed'); setVideoActive(false); }}
              data-testid="button-end-call"
            >
              <Phone className="h-4 w-4 rotate-[135deg]" />
            </button>
          </div>
        </div>
      );
    }

    if (widgetMode === 'voice') {
      return (
        <div className="bg-white rounded-2xl shadow-2xl w-80 h-[300px] flex flex-col overflow-hidden border border-gray-100" data-testid="widget-voice">
          <div className="p-3 text-white flex items-center justify-between" style={{ backgroundColor: WIDGET_TEAL }}>
            <div className="flex items-center gap-2">
              <button onClick={() => setWidgetMode('menu')} className="text-white/70 hover:text-white text-xs">←</button>
              <p className="font-semibold text-xs">Voice Call</p>
            </div>
            <button onClick={() => setWidgetMode('closed')} className="text-white/70 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <Phone className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="font-medium text-sm text-gray-900">Connected to {PERSONA_NAME}</p>
            <p className="text-xs text-gray-500 mt-1">AI Voice Assistant</p>
            <div className="flex items-center gap-1 mt-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-1 rounded-full bg-emerald-500 animate-pulse" style={{ height: `${12 + Math.random() * 16}px`, animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
          <div className="p-3 border-t border-gray-100 flex items-center justify-center gap-4">
            <button
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${micMuted ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setMicMuted(!micMuted)}
              data-testid="button-voice-mic"
            >
              {micMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <button
              className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
              onClick={() => setWidgetMode('closed')}
              data-testid="button-voice-end"
            >
              <Phone className="h-4 w-4 rotate-[135deg]" />
            </button>
          </div>
        </div>
      );
    }

    if (widgetMode === 'form') {
      return (
        <div className="bg-white rounded-2xl shadow-2xl w-80 flex flex-col overflow-hidden border border-gray-100" data-testid="widget-form">
          <div className="p-3 text-white flex items-center justify-between" style={{ backgroundColor: WIDGET_TEAL }}>
            <div className="flex items-center gap-2">
              <button onClick={() => setWidgetMode('menu')} className="text-white/70 hover:text-white text-xs" data-testid="button-form-back">←</button>
              <p className="font-semibold text-xs">Contact Form</p>
            </div>
            <button onClick={() => setWidgetMode('closed')} className="text-white/70 hover:text-white" data-testid="button-form-close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Name *</label>
              <input className="w-full text-sm h-9 px-3 rounded-md border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Your name" data-testid="input-form-name" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Email *</label>
              <input type="email" className="w-full text-sm h-9 px-3 rounded-md border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="your@email.com" data-testid="input-form-email" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Phone</label>
              <input type="tel" className="w-full text-sm h-9 px-3 rounded-md border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="(555) 123-4567" data-testid="input-form-phone" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Message *</label>
              <textarea className="w-full text-sm min-h-[60px] px-3 py-2 rounded-md border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" placeholder="How can we help?" data-testid="input-form-message" />
            </div>
            <Button className="w-full text-white" style={{ backgroundColor: WIDGET_TEAL }} data-testid="button-form-submit">
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen flex flex-col-reverse lg:flex-row relative" data-testid="landing-page">
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-white">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: GUNMETAL_BLUE }}>
              <Car className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">{ORG_NAME}</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-8">
            Let's schedule a VIP test drive
          </h1>

          {submitted ? (
            <div className="text-center py-12" data-testid="landing-success">
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4" style={{ color: GUNMETAL_BLUE }} />
              <h2 className="text-2xl font-bold text-gray-900">You're all set!</h2>
              <p className="text-gray-500 mt-2">
                We'll be in touch shortly. Check your phone for a text from our team.
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => setSubmitted(false)}
                data-testid="button-send-another"
              >
                Send another request
              </Button>
            </div>
          ) : (
            <>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-600">First Name</Label>
                    <input placeholder="John" className="mt-1 flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1" required data-testid="input-first-name" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Last Name</Label>
                    <input placeholder="Smith" className="mt-1 flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1" required data-testid="input-last-name" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Phone Number</Label>
                  <input type="tel" placeholder="(555) 123-4567" className="mt-1 flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1" required data-testid="input-phone" />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Email</Label>
                  <input type="email" placeholder="john@example.com" className="mt-1 flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1" data-testid="input-email" />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">What are you looking for?</Label>
                  <input placeholder="e.g. SUV under $40K, trade-in value" className="mt-1 flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1" data-testid="input-interest" />
                </div>
                <Button
                  type="submit"
                  className="w-full text-white mt-2"
                  style={{ backgroundColor: GUNMETAL_BLUE }}
                  data-testid="button-submit"
                >
                  Get in Touch
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </form>

              <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
                By submitting, you agree to receive communications from {ORG_NAME}. 
                Message & data rates may apply. Reply STOP to opt out.
              </p>
            </>
          )}
        </div>
      </div>

      <div
        className="lg:flex-1 flex items-center justify-center p-8 lg:p-16 relative overflow-hidden"
        style={{ backgroundColor: GUNMETAL_BLUE }}
        data-testid="landing-branding"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-[15%] right-[10%] w-96 h-96 rounded-full border border-white" />
          <div className="absolute top-[40%] right-[30%] w-48 h-48 rounded-full border border-white" />
        </div>

        <div className="relative text-center max-w-md">
          <button
            onClick={startVideoChat}
            className="relative w-64 h-64 mx-auto mb-6 group cursor-pointer"
            data-testid="button-hero-image"
          >
            <img
              src={liveVideoImg}
              alt="Start a live video chat"
              className="w-64 h-64 rounded-full object-cover border-4 border-white/30 shadow-lg animate-landing-spin"
            />
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <Video className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-md">
              <Video className="h-7 w-7 text-white" />
            </div>
          </button>
          <h2 className="text-3xl font-bold text-white leading-tight">
            We are here for you 24/7
          </h2>
          <p className="text-white/80 mt-4 text-lg leading-relaxed">
            Our AI-powered team is ready to help you find the perfect vehicle, 
            get a trade-in estimate, or schedule a test drive.
          </p>
          <button
            onClick={startVideoChat}
            className="inline-flex items-center gap-2 mt-5 text-white font-semibold text-lg hover:underline transition-colors"
            data-testid="button-hero-video-link"
          >
            <Video className="h-5 w-5" />
            Start a Live Video Chat
          </button>
          
          <div className="flex items-center justify-center gap-6 mt-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">500+</p>
              <p className="text-white/60 text-xs mt-0.5">Vehicles</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">4.9★</p>
              <p className="text-white/60 text-xs mt-0.5">Rating</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">24/7</p>
              <p className="text-white/60 text-xs mt-0.5">Available</p>
            </div>
          </div>
        </div>
      </div>

      {widgetMode !== 'closed' && (
        <div className="fixed bottom-20 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200" data-testid="widget-container">
          {renderWidgetContent()}
        </div>
      )}

      <button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white z-50 transition-transform hover:scale-105 active:scale-95"
        style={{ backgroundColor: WIDGET_TEAL }}
        onClick={() => setWidgetMode(widgetMode === 'closed' ? 'menu' : 'closed')}
        data-testid="button-widget-fab"
      >
        {widgetMode === 'closed' ? (
          <MessageSquare className="h-6 w-6" />
        ) : (
          <X className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}

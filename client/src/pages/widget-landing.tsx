import { useState } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ACCENT = '#0d9488';
const ORG_NAME = 'Cage Automotive';

export default function WidgetLandingPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" data-testid="landing-page">
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-white">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: ACCENT }}>
              <MessageSquare className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">{ORG_NAME}</span>
          </div>

          {submitted ? (
            <div className="text-center py-12" data-testid="landing-success">
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4" style={{ color: ACCENT }} />
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
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                Connect with our team
              </h1>
              <p className="text-gray-500 mt-2 mb-8">
                Fill in your details and we'll reach out to you right away — by text, call, or however you prefer.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-600">First Name</Label>
                    <Input placeholder="John" className="mt-1" required data-testid="input-first-name" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Last Name</Label>
                    <Input placeholder="Smith" className="mt-1" required data-testid="input-last-name" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Phone Number</Label>
                  <Input type="tel" placeholder="(555) 123-4567" className="mt-1" required data-testid="input-phone" />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Email</Label>
                  <Input type="email" placeholder="john@example.com" className="mt-1" data-testid="input-email" />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">What are you looking for?</Label>
                  <Input placeholder="e.g. SUV under $40K, trade-in value" className="mt-1" data-testid="input-interest" />
                </div>
                <Button
                  type="submit"
                  className="w-full text-white mt-2"
                  style={{ backgroundColor: ACCENT }}
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
        className="flex-1 flex items-center justify-center p-8 lg:p-16 relative overflow-hidden"
        style={{ backgroundColor: ACCENT }}
        data-testid="landing-branding"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[10%] left-[15%] w-72 h-72 rounded-full border-2 border-white" />
          <div className="absolute bottom-[15%] right-[10%] w-96 h-96 rounded-full border border-white" />
          <div className="absolute top-[40%] right-[30%] w-48 h-48 rounded-full border border-white" />
        </div>

        <div className="relative text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight">
            Your next car is a conversation away
          </h2>
          <p className="text-white/80 mt-4 text-lg leading-relaxed">
            Our AI-powered team is ready to help you find the perfect vehicle, 
            get a trade-in estimate, or schedule a test drive — 24/7.
          </p>
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
    </div>
  );
}

"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
  const [dots, setDots] = useState("");

  // Simple loading dots animation
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-background text-on-background min-h-screen flex items-center justify-center font-body-md overflow-hidden w-full absolute inset-0">
      
      <style dangerouslySetInnerHTML={{__html: `
        .glass-panel {
          background: rgba(18, 33, 49, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .gradient-border {
          position: relative;
          background-clip: padding-box;
          border: 1px solid transparent;
        }
        .gradient-border::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          margin: -1px;
          border-radius: inherit;
          background: linear-gradient(135deg, #a078ff, #0566d9);
          opacity: 0.3;
        }
        .glow-sphere {
          filter: blur(120px);
          opacity: 0.15;
          pointer-events: none;
        }
      `}} />

      {/* Background Ambient Effects */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="glow-sphere absolute -top-1/4 -left-1/4 w-[600px] h-[600px] bg-primary rounded-full"></div>
        <div className="glow-sphere absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-secondary-container rounded-full"></div>
      </div>

      <main className="w-full max-w-md px-margin-mobile md:px-0 z-10 text-center">
        <div className="glass-panel gradient-border rounded-xl p-8 md:p-10 shadow-2xl flex flex-col items-center gap-6">
          
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
            <MailCheck className="text-primary w-8 h-8" />
          </div>
          
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-headline-sm text-primary-fixed tracking-tight">Check Your Email</h1>
            <p className="font-body-md text-on-surface-variant">
              We just sent a secure verification link to your inbox.
            </p>
          </div>

          <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant w-full text-left">
            <h3 className="font-label-md text-on-surface mb-2">Next Steps:</h3>
            <ol className="text-body-sm text-on-surface-variant space-y-2 list-decimal list-inside">
              <li>Open your email client.</li>
              <li>Find the email from <strong>NoteSage</strong>.</li>
              <li>Click the verification link to securely unlock your dashboard.</li>
            </ol>
          </div>

          <div className="flex flex-col gap-4 w-full mt-2">
            <Link 
              href="/login"
              className="w-full bg-surface-container-high hover:bg-surface-variant border border-outline-variant/30 text-on-surface font-label-md py-3 rounded-lg transition-all duration-200 active:scale-95 text-center"
            >
              Return to Login
            </Link>
          </div>
          
          <p className="text-label-sm text-outline/60 mt-4">
            Waiting for verification{dots}
          </p>

        </div>
      </main>
    </div>
  );
}

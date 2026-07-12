"use client";

import { useTransition, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn, signUp } from "@/lib/auth-client";
import { loginSchema, registerSchema } from "@/validators/auth";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User as UserIcon, Eye, ArrowRight, Lightbulb } from "lucide-react";

interface AuthFormProps {
  type: "login" | "register";
}

export function AuthForm({ type }: AuthFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const router = useRouter();

  const isLogin = type === "login";
  const schema = isLogin ? loginSchema : registerSchema;

  const form = useForm<{ name?: string; email: string; password: string }>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  // Custom Cursor Effect logic
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isMouseIn, setIsMouseIn] = useState(false);

  useEffect(() => {
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      setIsMouseIn(true);
    };

    const onMouseLeave = () => {
      setIsMouseIn(false);
    };

    window.addEventListener("mousemove", onMouseMove);
    document.body.addEventListener("mouseleave", onMouseLeave);

    const animate = () => {
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;
      setCursorPos({ x: currentX, y: currentY });
      rafId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.body.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const onSubmit = (values: z.infer<typeof schema>) => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      if (isLogin) {
        const { data, error } = await signIn.email({
          email: values.email,
          password: values.password,
        });

        if (error) {
          setError(error.message || "Invalid credentials.");
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      } else {
        const { data, error } = await signUp.email({
          email: values.email,
          password: values.password,
          name: (values as any).name || "",
          callbackURL: "/dashboard",
        });

        if (error) {
          setError(error.message || "Something went wrong.");
        } else {
          setSuccess("Account created! Please check your email to verify your account.");
          form.reset();
          setTimeout(() => {
            router.push("/verify-email");
          }, 2000);
        }
      }
    });
  };

  const handleGoogleLogin = async () => {
    await signIn.social({
      provider: "google",
      callbackURL: "/dashboard"
    });
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex items-center justify-center font-body-md selection:bg-primary-container selection:text-on-primary-container overflow-hidden w-full absolute inset-0">
      
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
        .input-focus-glow:focus-within {
          box-shadow: 0 0 15px -3px rgba(160, 120, 255, 0.2);
        }
      `}} />

      {/* Background Ambient Effects */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="glow-sphere absolute -top-1/4 -left-1/4 w-[600px] h-[600px] bg-primary rounded-full"></div>
        <div className="glow-sphere absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-secondary-container rounded-full"></div>
      </div>

      {/* Main Auth Container */}
      <main className="w-full max-w-md px-margin-mobile md:px-0 z-10">
        <div className="glass-panel gradient-border rounded-xl p-8 md:p-10 shadow-2xl flex flex-col gap-8 transition-all duration-500">
          
          {/* Header Section */}
          <header className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center mb-2 shadow-lg shadow-primary-container/20">
              <Lightbulb className="text-on-primary-container w-6 h-6" />
            </div>
            <h1 className="font-display text-headline-lg text-primary-fixed tracking-tight">NoteSage</h1>
            <p className="font-body-md text-on-surface-variant max-w-[280px]">
              {isLogin ? "Continue your journey of intellectual clarity and deep focus." : "Start your journey of intellectual clarity and deep focus."}
            </p>
          </header>

          {/* Form Section */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <div className="flex flex-col gap-4">
                
                {!isLogin && (
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-1.5 group space-y-0">
                        <FormLabel className="font-label-md text-label-md text-on-surface-variant ml-1">Full Name</FormLabel>
                        <FormControl>
                          <div className="input-focus-glow flex items-center bg-surface-container-low border border-outline-variant focus-within:border-primary/50 focus-within:ring-0 rounded-lg px-4 py-3 transition-all duration-200">
                            <UserIcon className="text-outline mr-3 w-5 h-5" />
                            <input
                              className="bg-transparent border-none p-0 w-full focus:ring-0 text-body-md text-on-surface placeholder:text-outline/50 outline-none"
                              placeholder="John Doe"
                              disabled={isPending}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-1.5 group space-y-0">
                      <FormLabel className="font-label-md text-label-md text-on-surface-variant ml-1">Email address</FormLabel>
                      <FormControl>
                        <div className="input-focus-glow flex items-center bg-surface-container-low border border-outline-variant focus-within:border-primary/50 focus-within:ring-0 rounded-lg px-4 py-3 transition-all duration-200">
                          <Mail className="text-outline mr-3 w-5 h-5" />
                          <input
                            className="bg-transparent border-none p-0 w-full focus:ring-0 text-body-md text-on-surface placeholder:text-outline/50 outline-none"
                            placeholder="name@company.com"
                            type="email"
                            disabled={isPending}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-1.5 group space-y-0">
                      <div className="flex justify-between items-center ml-1">
                        <FormLabel className="font-label-md text-label-md text-on-surface-variant">Password</FormLabel>
                        {isLogin && (
                          <Link href="#" className="font-label-sm text-label-sm text-primary hover:text-primary-fixed transition-colors">
                            Forgot Password?
                          </Link>
                        )}
                      </div>
                      <FormControl>
                        <div className="input-focus-glow flex items-center bg-surface-container-low border border-outline-variant focus-within:border-primary/50 focus-within:ring-0 rounded-lg px-4 py-3 transition-all duration-200">
                          <Lock className="text-outline mr-3 w-5 h-5" />
                          <input
                            className="bg-transparent border-none p-0 w-full focus:ring-0 text-body-md text-on-surface placeholder:text-outline/50 outline-none"
                            placeholder="••••••••"
                            type="password"
                            disabled={isPending}
                            {...field}
                          />
                          <button className="text-outline hover:text-on-surface transition-colors focus:outline-none" type="button">
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-on-error-container bg-error-container/20 border border-error/50 rounded-lg font-medium">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg font-medium">
                  {success}
                </div>
              )}

              {/* Sign In Button */}
              <button 
                type="submit" 
                disabled={isPending}
                className="mt-2 w-full bg-gradient-to-r from-primary-container to-secondary-container text-on-primary-container font-label-md text-label-md py-4 rounded-lg shadow-xl shadow-primary-container/20 hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLogin ? "Sign In" : "Create Account"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </Form>

          {/* Divider */}
          <div className="flex items-center gap-4 text-outline/30">
            <div className="h-px w-full bg-current"></div>
            <span className="font-label-sm text-label-sm text-outline shrink-0">OR CONTINUE WITH</span>
            <div className="h-px w-full bg-current"></div>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={handleGoogleLogin} 
              disabled={isPending}
              className="flex items-center justify-center gap-3 bg-surface-container-high hover:bg-surface-variant border border-outline-variant/30 rounded-lg py-3 transition-all duration-200 active:scale-95 group disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M12 5.04c1.9 0 3.61.65 4.95 1.93l3.71-3.71C18.41 1.27 15.42 0 12 0 7.31 0 3.25 2.69 1.25 6.64l4.24 3.3C6.49 7.13 9.01 5.04 12 5.04z" fill="#EA4335"></path>
                <path d="M23.49 12.27c0-.83-.07-1.63-.2-2.39H12v4.52h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-1.99 3.42-4.93 3.42-8.58z" fill="#4285F4"></path>
                <path d="M5.49 14.86c-.24-.72-.37-1.49-.37-2.31s.13-1.59.37-2.31L1.25 6.94C.45 8.5.01 10.22.01 12.02c0 1.79.44 3.51 1.24 5.07l4.24-3.23z" fill="#FBBC05"></path>
                <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.7-2.87c-1.09.73-2.48 1.16-4.23 1.16-2.99 0-5.51-2.09-6.51-4.92l-4.24 3.3C3.25 21.31 7.31 24 12 24z" fill="#34A853"></path>
              </svg>
              <span className="font-label-md text-label-md text-on-surface-variant group-hover:text-on-surface">Continue with Google</span>
            </button>
          </div>

          {/* Footer */}
          <footer className="text-center">
            <p className="font-body-sm text-on-surface-variant">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Link href={isLogin ? "/register" : "/login"} className="text-primary font-label-md hover:underline decoration-primary/30 underline-offset-4 ml-1">
                {isLogin ? "Sign Up" : "Sign In"}
              </Link>
            </p>
          </footer>
        </div>

        {/* System Status Labels (Subtle) */}
        <div className="mt-8 flex justify-between px-2 opacity-40">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
            <span className="font-label-sm text-label-sm">AI Core Online</span>
          </div>
          <p className="font-label-sm text-label-sm">v2.4.0</p>
        </div>
      </main>

      {/* Custom Cursor Effect */}
      <div 
        className="fixed w-[400px] h-[400px] bg-primary rounded-full blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2 mix-blend-screen transition-opacity duration-700" 
        style={{ 
          left: cursorPos.x, 
          top: cursorPos.y,
          opacity: isMouseIn ? 0.08 : 0 
        }}
      />
    </div>
  );
}

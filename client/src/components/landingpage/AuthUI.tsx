"use client";

import * as React from "react";
import { useState, useId, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useNavigate, Link } from "react-router-dom";
import { initFirebase } from "../../config/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  GoogleAuthProvider, 
  signInWithPopup, 
  type Auth 
} from "firebase/auth";
import { CyberTwin3DCanvas } from "./CyberTwin3DCanvas";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface TypewriterProps {
  text: string | string[];
  speed?: number;
  cursor?: string;
  loop?: boolean;
  deleteSpeed?: number;
  delay?: number;
  className?: string;
}

export function Typewriter({
  text,
  speed = 80,
  cursor = "|",
  loop = false,
  deleteSpeed = 50,
  delay = 1500,
  className,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [textArrayIndex, setTextArrayIndex] = useState(0);

  const textArray = Array.isArray(text) ? text : [text];
  const currentText = textArray[textArrayIndex] || "";

  useEffect(() => {
    if (!currentText) return;

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (currentIndex < currentText.length) {
            setDisplayText((prev) => prev + currentText[currentIndex]);
            setCurrentIndex((prev) => prev + 1);
          } else if (loop) {
            setTimeout(() => setIsDeleting(true), delay);
          }
        } else {
          if (displayText.length > 0) {
            setDisplayText((prev) => prev.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentIndex(0);
            setTextArrayIndex((prev) => (prev + 1) % textArray.length);
          }
        }
      },
      isDeleting ? deleteSpeed : speed,
    );

    return () => clearTimeout(timeout);
  }, [
    currentIndex,
    isDeleting,
    currentText,
    loop,
    speed,
    deleteSpeed,
    delay,
    displayText,
    text,
  ]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse text-blue-400">{cursor}</span>
    </span>
  );
}

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-300"
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/40",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-blue-400 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-6",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-2 text-sm text-white shadow-sm transition-all placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, ...props }, ref) => {
    const id = useId();
    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
    return (
      <div className="grid w-full items-center gap-1.5">
        {label && <Label htmlFor={id}>{label}</Label>}
        <div className="relative">
          <Input id={id} type={showPassword ? "text" : "password"} className={cn("pe-10", className)} ref={ref} {...props} />
          <button type="button" onClick={togglePasswordVisibility} className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-zinc-400 transition-colors hover:text-white focus:outline-none" aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? (<EyeOff className="size-4" aria-hidden="true" />) : (<Eye className="size-4" aria-hidden="true" />)}
          </button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

interface FormProps {
  auth: Auth;
  onSuccess: () => void;
}

function SignInForm({ auth, onSuccess }: FormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignIn} autoComplete="on" className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">Sign in to SentinelAI</h1>
        <p className="text-xs text-zinc-400">Enter your security credentials to access the console</p>
      </div>
      {error && (
        <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl">
          {error.replace("Firebase:", "").trim()}
        </div>
      )}
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="email">Work Email</Label>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="name@company.com" 
            required 
            autoComplete="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <PasswordInput 
          name="password" 
          label="Password" 
          required 
          autoComplete="current-password" 
          placeholder="••••••••" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="default" className="mt-2" disabled={loading}>
          {loading ? "Authenticating..." : "Sign In to Gateway"}
        </Button>
      </div>
    </form>
  );
}

function SignUpForm({ auth, onSuccess }: FormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp} autoComplete="on" className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">Create SentinelAI Account</h1>
        <p className="text-xs text-zinc-400">Initialize your cyber defense twin workspace</p>
      </div>
      {error && (
        <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl">
          {error.replace("Firebase:", "").trim()}
        </div>
      )}
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="name">Full Name</Label>
          <Input 
            id="name" 
            name="name" 
            type="text" 
            placeholder="Security Analyst" 
            required 
            autoComplete="name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="email">Work Email</Label>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="name@company.com" 
            required 
            autoComplete="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <PasswordInput 
          name="password" 
          label="Password" 
          required 
          autoComplete="new-password" 
          placeholder="••••••••" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="default" className="mt-2" disabled={loading}>
          {loading ? "Creating Workspace..." : "Create Account"}
        </Button>
      </div>
    </form>
  );
}

function AuthFormContainer({ 
  auth, 
  isSignIn, 
  onToggle, 
  onSuccess 
}: { 
  auth: Auth; 
  isSignIn: boolean; 
  onToggle: () => void; 
  onSuccess: () => void; 
}) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setGoogleError(err.message || "Google Sign-In failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-sm gap-4">
      {/* Brand Header */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">SentinelAI</span>
        </Link>
      </div>

      {isSignIn ? (
        <SignInForm auth={auth} onSuccess={onSuccess} />
      ) : (
        <SignUpForm auth={auth} onSuccess={onSuccess} />
      )}

      <div className="text-center text-xs text-zinc-400">
        {isSignIn ? "Don't have a workspace?" : "Already registered?"}{" "}
        <Button variant="link" className="text-blue-400 font-semibold" onClick={onToggle}>
          {isSignIn ? "Sign up" : "Sign in"}
        </Button>
      </div>

      {googleError && (
        <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl">
          {googleError.replace("Firebase:", "").trim()}
        </div>
      )}

      <div className="relative text-center text-xs my-2 after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-white/10">
        <span className="relative z-10 bg-black px-2 text-zinc-500 uppercase tracking-wider font-mono">Or continue with</span>
      </div>

      <Button variant="outline" type="button" onClick={handleGoogleSignIn} disabled={googleLoading}>
        {googleLoading ? (
          "Connecting..."
        ) : (
          <>
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google icon" className="mr-2 h-4 w-4" />
            Continue with Google SSO
          </>
        )}
      </Button>
    </div>
  );
}

export function AuthUI() {
  const [isSignIn, setIsSignIn] = useState(true);
  const toggleForm = () => setIsSignIn((prev) => !prev);

  const [auth, setAuth] = useState<Auth | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    initFirebase()
      .then((authInstance) => {
        if (active) {
          setAuth(authInstance);
          setLoadingConfig(false);
        }
      })
      .catch((err) => {
        if (active) {
          console.error("Firebase init error:", err);
          setConfigError(err.message || "Could not connect to authentication gateway.");
          setLoadingConfig(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleAuthSuccess = () => {
    navigate("/dashboard");
  };

  return (
    <div className="w-full min-h-screen md:grid md:grid-cols-12 bg-black overflow-hidden">
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
      `}</style>

      {/* Left Column: Form Controls */}
      <div className="md:col-span-6 lg:col-span-5 flex h-screen items-center justify-center p-6 bg-black relative z-20">
        {loadingConfig ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-zinc-400 text-xs font-mono">Connecting to SentinelAI Auth Gateway...</p>
          </div>
        ) : configError ? (
          <div className="flex flex-col items-center gap-4 text-center max-w-sm px-4">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-xl font-semibold text-white">Gateway Connection Timeout</h2>
            <p className="text-zinc-400 text-xs">{configError}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Retry Connection</Button>
          </div>
        ) : auth ? (
          <AuthFormContainer 
            auth={auth} 
            isSignIn={isSignIn} 
            onToggle={toggleForm} 
            onSuccess={handleAuthSuccess} 
          />
        ) : null}
      </div>

      {/* Right Column: Project-Relevant 3D Cyber Defense Visualizer */}
      <div className="hidden md:block md:col-span-6 lg:col-span-7 relative bg-gradient-to-br from-zinc-950 via-black to-blue-950/40 border-l border-white/10 overflow-hidden">
        <CyberTwin3DCanvas isSignIn={isSignIn} />
      </div>
    </div>
  );
}

export default AuthUI;

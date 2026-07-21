"use client";

import * as React from "react";
import { useState, useId, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { initFirebase } from "../../config/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  GoogleAuthProvider, 
  signInWithPopup, 
  type Auth 
} from "firebase/auth";

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
  speed = 100,
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
      <span className="animate-pulse">{cursor}</span>
    </span>
  );
}

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input dark:border-input/50 bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary-foreground/60 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-6",
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
          "flex h-10 w-full rounded-lg border border-input dark:border-input/50 bg-background px-3 py-3 text-sm text-foreground shadow-sm shadow-black/5 transition-shadow placeholder:text-muted-foreground/70 focus-visible:bg-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
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
      <div className="grid w-full items-center gap-2">
        {label && <Label htmlFor={id}>{label}</Label>}
        <div className="relative">
          <Input id={id} type={showPassword ? "text" : "password"} className={cn("pe-10", className)} ref={ref} {...props} />
          <button type="button" onClick={togglePasswordVisibility} className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-muted-foreground/80 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50" aria-label={showPassword ? "Hide password" : "Show password"}>
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
    <form onSubmit={handleSignIn} autoComplete="on" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Sign in to your account</h1>
        <p className="text-balance text-sm text-muted-foreground">Enter your email below to sign in</p>
      </div>
      {error && (
        <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
          {error.replace("Firebase:", "").trim()}
        </div>
      )}
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="m@example.com" 
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
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="outline" className="mt-2" disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
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
    <form onSubmit={handleSignUp} autoComplete="on" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-balance text-sm text-muted-foreground">Enter your details below to sign up</p>
      </div>
      {error && (
        <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
          {error.replace("Firebase:", "").trim()}
        </div>
      )}
      <div className="grid gap-4">
        <div className="grid gap-1">
          <Label htmlFor="name">Full Name</Label>
          <Input 
            id="name" 
            name="name" 
            type="text" 
            placeholder="John Doe" 
            required 
            autoComplete="name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="m@example.com" 
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
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="outline" className="mt-2" disabled={loading}>
          {loading ? "Signing Up..." : "Sign Up"}
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
    <div className="mx-auto grid w-[350px] gap-2">
      {isSignIn ? (
        <SignInForm auth={auth} onSuccess={onSuccess} />
      ) : (
        <SignUpForm auth={auth} onSuccess={onSuccess} />
      )}
      <div className="text-center text-sm">
        {isSignIn ? "Don't have an account?" : "Already have an account?"}{" "}
        <Button variant="link" className="pl-1 text-foreground" onClick={onToggle}>
          {isSignIn ? "Sign up" : "Sign in"}
        </Button>
      </div>
      {googleError && (
        <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
          {googleError.replace("Firebase:", "").trim()}
        </div>
      )}
      <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
        <span className="relative z-10 bg-background px-2 text-muted-foreground">Or continue with</span>
      </div>
      <Button variant="outline" type="button" onClick={handleGoogleSignIn} disabled={googleLoading}>
        {googleLoading ? (
          "Connecting..."
        ) : (
          <>
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google icon" className="mr-2 h-4 w-4" />
            Continue with Google
          </>
        )}
      </Button>
    </div>
  );
}

interface AuthContentProps {
    image?: {
        src: string;
        alt: string;
    };
    quote?: {
        text: string;
        author: string;
    }
}

interface AuthUIProps {
    signInContent?: AuthContentProps;
    signUpContent?: AuthContentProps;
}

const defaultSignInContent = {
    image: {
        src: "https://i.ibb.co/XrkdGrrv/original-ccdd6d6195fff2386a31b684b7abdd2e-removebg-preview.png",
        alt: "A beautiful interior design for sign-in"
    },
    quote: {
        text: "Welcome Back! The journey continues.",
        author: "EaseMize UI"
    }
};

const defaultSignUpContent = {
    image: {
        src: "https://i.ibb.co/HTZ6DPsS/original-33b8479c324a5448d6145b3cad7c51e7-removebg-preview.png",
        alt: "A vibrant, modern space for new beginnings"
    },
    quote: {
        text: "Create an account. A new chapter awaits.",
        author: "EaseMize UI"
    }
};

export function AuthUI({ signInContent = {}, signUpContent = {} }: AuthUIProps) {
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

  const finalSignInContent = {
      image: { ...defaultSignInContent.image, ...signInContent.image },
      quote: { ...defaultSignInContent.quote, ...signInContent.quote },
  };
  const finalSignUpContent = {
      image: { ...defaultSignUpContent.image, ...signUpContent.image },
      quote: { ...defaultSignUpContent.quote, ...signUpContent.quote },
  };

  const currentContent = isSignIn ? finalSignInContent : finalSignUpContent;

  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const imageRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    setMousePosition({ x: x * 10, y: y * 10 });
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
  };

  return (
    <div className="w-full min-h-screen md:grid md:grid-cols-2 bg-black">
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
      `}</style>
      <div className="flex h-screen items-center justify-center p-6 md:h-auto md:p-0 md:py-12 bg-black">
        {loadingConfig ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
            <p className="text-muted-foreground text-sm">Securing handshake with Sentinel gateway...</p>
          </div>
        ) : configError ? (
          <div className="flex flex-col items-center gap-4 text-center max-w-sm px-4">
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-full">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">Gateway Connection Error</h2>
            <p className="text-muted-foreground text-sm">{configError}</p>
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

      <motion.div
        ref={imageRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, rotateY: 45 }}
        animate={{ opacity: 1, rotateY: 0 }}
        exit={{ opacity: 0, rotateY: -45 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden md:flex relative overflow-hidden rounded-xl md:rounded-none items-center justify-center perspective"
        style={{
          perspective: "1200px",
          backgroundImage: `url(${currentContent.image.src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        key={currentContent.image.src}
      >
        <motion.div
          animate={{
            rotateX: mousePosition.y * 0.8,
            rotateY: mousePosition.x * 0.8,
            z: 50,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 60 }}
          className="w-full h-full"
          style={{
            transformStyle: "preserve-3d",
            transformOrigin: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
          <div className="absolute inset-x-0 bottom-0 h-[100px] bg-gradient-to-t from-background to-transparent" />

          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="relative z-10 flex h-full flex-col items-center justify-end p-2 pb-6"
          >
            <blockquote className="space-y-2 text-center text-foreground">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                className="text-lg font-medium"
              >
                "<Typewriter
                    key={currentContent.quote.text}
                    text={currentContent.quote.text}
                    speed={60}
                  />"
              </motion.p>
              <motion.cite
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                className="block text-sm font-light text-muted-foreground not-italic"
              >
                — {currentContent.quote.author}
              </motion.cite>
            </blockquote>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

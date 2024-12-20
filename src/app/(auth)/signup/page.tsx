"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNotification } from "@/context/NotificationContext";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useAuth } from "@/hooks/useAuth";

const capitalizeWords = (str: string) => {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signUp, isLoading } = useAuth();
  const { success, error: showError } = useNotification();

  const validateEmail = (email: string) => {
    // Basic email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!email || !password || !name) {
        showError("All fields are required");
        setLoading(false);
        return;
      }

      // Validate email format
      if (!validateEmail(email)) {
        showError("Please enter a valid email address");
        setLoading(false);
        return;
      }

      // Validate password length
      if (password.length < 6) {
        showError("Password must be at least 6 characters long");
        setLoading(false);
        return;
      }

      // Validate name
      if (name.trim().length === 0) {
        showError("Please enter your name");
        setLoading(false);
        return;
      }

      const capitalizedName = capitalizeWords(name.trim());
      const result = await signUp(email, password, capitalizedName);
      
      if (result) {
        success("Account created successfully! Please sign in to continue.");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error.message.includes("Email already in use")) {
        showError("Email already in use. Please try a different email address.");
      } else {
        showError(error.message || "Failed to create account. Please try again later.");
      }
      
      // Clear all input fields on error
      setEmail("");
      setPassword("");
      setName("");
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    // Update the input value with capitalized version
    e.target.value = capitalizeWords(value);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-8 dark:bg-neutral-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white px-8 py-12 shadow dark:bg-neutral-800 sm:px-10">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Create your account
          </h2>

          <form className="space-y-6" onSubmit={handleSignUp}>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-200"
              >
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={capitalizeWords(name)}
                  onChange={handleNameChange}
                  className="block w-full appearance-none rounded-md border border-neutral-300 px-3 py-2 shadow-sm placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder:text-neutral-400 sm:text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-200"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-neutral-300 px-3 py-2 shadow-sm placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder:text-neutral-400 sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-200"
              >
                Password
              </label>
              <div className="mt-1">
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-neutral-300 px-3 py-2 shadow-sm placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder:text-neutral-400 sm:text-sm"
                  placeholder="••••••••"
                  showStrengthIndicator
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || isLoading}
                className="flex w-full justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-primary-500 dark:hover:bg-primary-400"
              >
                {loading || isLoading ? "Creating account..." : "Sign up"}
              </button>
            </div>

          </form>

          <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

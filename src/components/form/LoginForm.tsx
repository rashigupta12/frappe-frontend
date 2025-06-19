/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Eye, EyeOff } from "lucide-react";
import { FormError } from "./form-error";
import { FormSuccess } from "./form-success";
import { useAuth } from "../../context/AuthContext";
import { Navigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';


// Define form schema
const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof formSchema>;

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, setIsPending] = useState(false);
  const { login, loading, isAuthenticated } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (values: FormValues) => {
    setIsPending(true);
    setError("");
    setSuccess("");
    
    try {
      const result = await login(values.email, values.password);
      
      if (result.success) {
        toast.success('Login successfully!');
        
        setSuccess("Login successful!");
        // Navigation will happen automatically due to isAuthenticated check
      } else {
        toast.error('Login failed. Please check your credentials.');
        setError(result.error || "Login failed");
      }
    } catch (err) {
      toast.error('Login failed. Invalid credentials.');
      setError("Invalid credentials");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-emerald-500 to-blue-500">
  {/* Backdrop blur layer for enhanced glass effect */}
  <div className="fixed inset-0 backdrop-blur-sm bg-black/10"></div>
  
  <div className="relative w-full max-w-md p-8 space-y-8 bg-white/20 rounded-xl shadow-2xl backdrop-blur-lg border border-white/30 overflow-hidden">
    {/* Subtle gradient overlay for glass effect */}
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-blue-400/10"></div>
    
    {/* Content container with relative positioning */}
    <div className="relative z-10">
      {/* Logo Section */}
      <Link to="/">
        <div className="flex flex-col items-center space-y-2">
          <img
            src="/logo.jpg"
            alt="logo"
            height={100}
            width={100}
            className="shadow-md hover:shadow-xl transition-shadow duration-300 p-4 bg-white/30 rounded-full backdrop-blur-sm border border-white/20"
          />
        </div>
      </Link>

      {/* Login Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white drop-shadow-md">Welcome Back</h1>
        <p className="mt-2 text-sm text-white/90">Please login to your account</p>
      </div>

      {/* Login Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <div className="text-sm font-medium text-white">Email</div>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="john.snow@gmail.com"
                    className="h-12 rounded-lg border-white/30 bg-white/20 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-transparent backdrop-blur-sm"
                    type="email"
                    disabled={isPending || loading}
                  />
                </FormControl>
                <FormMessage className="text-sm text-amber-200 drop-shadow-sm" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="text-sm font-medium text-white/90">Password</div>
                <div className="relative">
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="********"
                      className="h-12 rounded-lg border-white/30 bg-white/20 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-transparent backdrop-blur-sm"
                      type={showPassword ? "text" : "password"}
                      disabled={isPending || loading}
                    />
                  </FormControl>
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:text-white transition-colors"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <FormMessage className="text-sm text-amber-200 drop-shadow-sm" />
              </FormItem>
            )}
          />

          <FormError message={error} />
          <FormSuccess message={success} />

          <button
            type="submit"
            disabled={isPending || loading}
            className="w-full h-12 bg-white/30 text-white rounded-lg font-medium hover:bg-white/40 transition-all duration-300 transform hover:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm border border-white/30 shadow-lg"
          >
            {isPending || loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : (
              "Login now"
            )}
          </button>
        </form>
      </Form>
    </div>
  </div>
</div>
  );
}

export default LoginForm;
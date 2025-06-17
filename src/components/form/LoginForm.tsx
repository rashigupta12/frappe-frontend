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
        setSuccess("Login successful!");
        // Navigation will happen automatically due to isAuthenticated check
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("Invalid credentials");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-emerald-500 to-blue-500">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        {/* Logo Section */}
        <div className="flex flex-col items-center space-y-2">
          <img
            src="https://gojf7j54p4.ufs.sh/f/CcC11ljtXd0cVJkIxkqEgHb468cUmrZkfjiutLze1KlGD7xp"
            alt="logo"
            height={100}
            width={100}
            className="shadow-md hover:shadow-xl transition-shadow duration-300 p-4"
          />
        </div>

        {/* Login Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
          <p className="mt-2 text-sm text-gray-600">Please login to your account</p>
        </div>

        {/* Login Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <div className="text-sm font-medium text-gray-700">Email</div>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="john.snow@gmail.com"
                      className="h-12 rounded-lg border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      type="email"
                      disabled={isPending || loading}
                    />
                  </FormControl>
                  <FormMessage className="text-sm text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="text-sm font-medium text-gray-700">Password</div>
                  <div className="relative">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="********"
                        className="h-12 rounded-lg border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        type={showPassword ? "text" : "password"}
                        disabled={isPending || loading}
                      />
                    </FormControl>
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-emerald-600 transition-colors"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <FormMessage className="text-sm text-red-500" />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-emerald-600 hover:text-emerald-800 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <FormError message={error} />
            <FormSuccess message={success} />

            <button
              type="submit"
              disabled={isPending || loading}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
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

            <div className="text-center">
              <Link 
                to="/register" 
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Don't have an account? {" "}
                <span className="text-emerald-600 hover:text-emerald-800 font-medium">
                  Register Instead
                </span>
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default LoginForm;
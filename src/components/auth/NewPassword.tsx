"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Eye, EyeOff, LockKeyhole, RefreshCw } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
// import { showToast } from "react-hot-showToast";

import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FormError } from "../form/form-error";
import { FormSuccess } from "../form/form-success";
import { showToast } from "../../helpers/comman";

const passwordResetSchema = z.object({
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordResetFormValues = z.infer<typeof passwordResetSchema>;

export function FirstTimePasswordReset() {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, setIsPending] = useState(false);


  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const { resetPassword} = useAuth();
  const navigate = useNavigate();


  const form = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  useEffect(() => {
    return () => {
      // Clear session when component unmounts (user navigates away)
      localStorage.removeItem('frappe_user');
      localStorage.removeItem('frappe_session');
      localStorage.removeItem('frappe_csrf_token');
    };
  }, []);

  const onSubmit = async (values: PasswordResetFormValues) => {
    if (!email) {
      setError("Email is required");
      return;
    }

    setIsPending(true);
    setError("");
    setSuccess("");

    try {
      if (!resetPassword) {
        throw new Error("Password reset functionality not available");
      }

      const result = await resetPassword(email, values.newPassword);

      if (result.success) {
        showToast.success("Password updated successfully!");
        setSuccess("Password updated successfully!");
        
        
        // Use replace to prevent back navigation
        navigate("/login", { replace: true });
      } else {
        showToast.error("Failed to update password. Please try again.");
        setError(result.error || "Failed to update password");
      }
    } catch (err) {
      console.error("Password reset error:", err);
      showToast.error("Failed to update password. Please try again.");
      setError("Failed to update password");
      
      // Clear session on error
      localStorage.removeItem('frappe_user');
      localStorage.removeItem('frappe_session');
      localStorage.removeItem('frappe_csrf_token');
    } finally {
      setIsPending(false);
    }
  };


//  if (isAuthenticated) {
//   return <Navigate to="/dashboard" replace />;
// }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      {/* Subtle animated background elements */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      {/* Main card container */}
      <div className="relative w-full max-w-md">
        {/* Card shadow and outline */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-emerald-100 to-cyan-100 opacity-60 blur-md"></div>
        <div className="absolute -inset-0.5 rounded-3xl bg-white border border-emerald-100/50"></div>

        {/* Content container */}
        <div className="relative z-10 p-8 space-y-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Accent light reflections */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-emerald-50 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-cyan-50 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-3000"></div>
          </div>

          {/* Logo section */}
          <div className="flex flex-col items-center">
            <Link to="/" className="group">
              <div className="p-1.5 bg-gradient-to-br from-emerald-100 to-cyan-100 rounded-full shadow-sm group-hover:shadow-md transition-all duration-300">
                <img
                  src="/logo.jpg"
                  alt="logo"
                  className="h-20 w-20 object-cover rounded-full border-2 border-white shadow-inner"
                />
              </div>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
              Set New Password
            </h1>
            <p className="text-emerald-600 font-light">
              Create a secure password for your account
            </p>
          </div>

          {/* Password Reset Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Account info */}
              <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
                <p className="text-sm text-emerald-800 font-medium">
                  Account: <span className="font-normal">{email}</span>
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  You're setting your password for the first time
                </p>
              </div>

              {/* New Password field */}
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm font-medium text-emerald-700">
                      New Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          placeholder="Enter new password"
                          className="h-12 pl-10 pr-10 rounded-xl border-emerald-200 bg-white text-black placeholder-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                          type={showNewPassword ? "text" : "password"}
                          disabled={isPending}
                        />
                        <LockKeyhole
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400"
                          size={18}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-600 transition-colors"
                          onClick={toggleNewPasswordVisibility}
                        >
                          {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-amber-500 font-medium" />
                  </FormItem>
                )}
              />

              {/* Confirm Password field */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm font-medium text-emerald-700">
                      Confirm Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          placeholder="Confirm new password"
                          className="h-12 pl-10 pr-10 rounded-xl border-emerald-200 bg-white text-black placeholder-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                          type={showConfirmPassword ? "text" : "password"}
                          disabled={isPending}
                        />
                        <LockKeyhole
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400"
                          size={18}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-600 transition-colors"
                          onClick={toggleConfirmPasswordVisibility}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-amber-500 font-medium" />
                  </FormItem>
                )}
              />

              {/* Password requirements */}
              <div className="text-xs text-gray-600 space-y-1">
                <p className="font-medium text-emerald-700">Password must contain:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li>At least 8 characters</li>
                  <li>One uppercase letter</li>
                  <li>One lowercase letter</li>
                  <li>One number</li>
                  <li>One special character (@$!%*?&)</li>
                </ul>
              </div>

              {/* Status messages */}
              <div className="space-y-2">
                <FormError message={error} />
                <FormSuccess message={success} />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 relative overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative z-10 flex items-center justify-center">
                  {isPending ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span className="ml-2">Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </span>
              </button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
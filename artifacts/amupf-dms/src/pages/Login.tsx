import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();
  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      const response = await loginMutation.mutateAsync({ data: values });
      setToken(response.access_token);
      toast.success("Successfully logged in");
      
      if (!response.user.is_approved) {
        setLocation("/pending-approval");
      } else {
        setLocation("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to login. Please check your credentials.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Sign in to AMUPF
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Enter your credentials to access the portal
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-900">Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="student@amu.edu.et" {...field} className="border-slate-300" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-900">Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="border-slate-300" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full bg-primary text-white hover:bg-primary/90" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Form>
        <div className="text-center text-sm text-slate-600 mt-4">
          Don't have an account?{" "}
          <Link href="/register">
            <a className="font-semibold text-primary hover:underline">Register here</a>
          </Link>
        </div>
        <div className="text-center text-sm text-slate-600 mt-2">
          <Link href="/">
            <a className="text-slate-500 hover:text-slate-900 hover:underline">Return to Home</a>
          </Link>
        </div>
      </div>
    </div>
  );
}

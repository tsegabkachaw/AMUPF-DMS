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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRegister, useListDepartments } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

type Department = {
  id: number;
  name: string;
};
const registerSchema = z.object({
  full_name: z.string().min(3, { message: "Full name must be at least 3 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  student_id: z.string().min(1, { message: "Student ID is required" }),
  phone: z.string().min(1, { message: "Phone number is required" }),
  department_id: z.coerce.number().min(1, { message: "Please select a department" }),
  id_front_url: z.string().url({ message: "Must be a valid URL" }),
  id_back_url: z.string().url({ message: "Must be a valid URL" }),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();
  const registerMutation = useRegister();
 const { data: departments } = useListDepartments<Department[]>();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      student_id: "",
      phone: "",
      department_id: 0,
      id_front_url: "",
      id_back_url: "",
    },
  });

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    try {
      const response = await registerMutation.mutateAsync({ data: values });
      setToken(response.access_token);
      toast.success("Registration successful. Waiting for approval.");
      setLocation("/pending-approval");
    } catch (error: any) {
      toast.error(error.message || "Failed to register. Please check your inputs.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4">
      <div className="w-full max-w-2xl space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Student Registration
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Create an account to join the Arbaminch University Peace Forum
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900">Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900">Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="student@amu.edu.et" {...field} />
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
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="student_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900">Student ID</FormLabel>
                    <FormControl>
                      <Input placeholder="AMU/1234/15" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900">Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+251..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900">Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value ? String(field.value) : undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                          
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments?.map((dept: Department) => (
                          <SelectItem key={dept.id} value={String(dept.id)}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="id_front_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900">ID Card Front (URL)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/id-front.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="id_back_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900">ID Card Back (URL)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/id-back.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-primary text-white hover:bg-primary/90 h-12 text-base" 
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Submitting Registration..." : "Complete Registration"}
              </Button>
            </div>
          </form>
        </Form>
        <div className="text-center text-sm text-slate-600 mt-6">
          Already have an account?{" "}
          <Link href="/login">
            <span className="font-semibold text-primary hover:underline">Sign in here</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

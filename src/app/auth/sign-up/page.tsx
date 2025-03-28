import { SignUpForm } from "../../components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold text-center mb-6">
          Crie sua conta
        </h1>
        <SignUpForm />
      </div>
    </div>
  );
}
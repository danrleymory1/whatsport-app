// app/auth/sign-in/page.tsx
import { SignInForm } from "../../../components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold text-center mb-6">
          Entrar na sua conta
        </h1>
        <SignInForm />
      </div>
    </div>
  );
}
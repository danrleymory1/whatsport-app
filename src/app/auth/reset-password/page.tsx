import { ResetPasswordForm } from "../../components/auth/reser-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold text-center mb-6">
          Redefinir Senha
        </h1>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
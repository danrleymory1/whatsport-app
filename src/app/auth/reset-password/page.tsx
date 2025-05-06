import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
    return (
        <div>
            <h2 className="text-2xl font-bold">Redefinir senha</h2>
            <p className="text-muted-foreground text-sm mb-6">
                Crie uma nova senha para sua conta
            </p>
            <ResetPasswordForm />
        </div>
    );
}
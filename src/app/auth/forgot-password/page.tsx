import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
    return (
        <div>
            <h2 className="text-2xl font-bold">Esqueceu sua senha?</h2>
            <p className="text-muted-foreground text-sm mb-6">
                Enviaremos um link para redefinir sua senha
            </p>
            <ForgotPasswordForm />
        </div>
    );
}
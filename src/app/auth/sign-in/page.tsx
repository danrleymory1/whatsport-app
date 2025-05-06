import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
    return (
        <div>
            <h2 className="text-2xl font-bold">Entre na sua conta</h2>
            <p className="text-muted-foreground text-sm mb-6">
                Bem-vindo de volta! Entre com suas credenciais
            </p>
            <SignInForm />
        </div>
    );
}
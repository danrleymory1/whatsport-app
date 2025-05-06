import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
    return (
        <div>
            <h2 className="text-2xl font-bold">Crie sua conta</h2>
            <p className="text-muted-foreground text-sm mb-6">
                Preencha o formulário abaixo para criar sua conta
            </p>
            <SignUpForm />
        </div>
    );
}
"use client"; // Adicione esta linha

import { useAuth } from "./context/auth-context";

export default function Home() {
    const { isAuthenticated, userEmail } = useAuth();

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">Bem-vindo à Whatsport!</h1>
            {isAuthenticated ? (
                <div>
                    <p>Você está logado como {userEmail}.</p>
                    {/* Conteúdo da área logada */}
                </div>
            ) : (
                <p>Faça login para começar.</p>
            )}
        </div>
    );
}
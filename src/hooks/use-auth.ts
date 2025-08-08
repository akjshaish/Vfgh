
'use client';

import { useState, useEffect } from 'react';

interface AuthState {
    userId: string | null;
    userEmail: string | null;
    loading: boolean;
}

export function useAuth(): AuthState {
    const [auth, setAuth] = useState<AuthState>({ 
        userId: null, 
        userEmail: null,
        loading: true 
    });

    useEffect(() => {
        // This code runs only on the client-side
        const storedUserId = localStorage.getItem('userId');
        const storedUserEmail = localStorage.getItem('userEmail');
        
        setAuth({
            userId: storedUserId,
            userEmail: storedUserEmail,
            loading: false,
        });

        const handleStorageChange = () => {
            const updatedUserId = localStorage.getItem('userId');
            const updatedUserEmail = localStorage.getItem('userEmail');
            setAuth({
                userId: updatedUserId,
                userEmail: updatedUserEmail,
                loading: false
            });
        };
        
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };

    }, []);

    return auth;
}

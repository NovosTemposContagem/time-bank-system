'use client';

import { useState, useEffect } from 'react';
import { LogOut, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './employee.module.css';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        fetch('/api/auth/user')
            .then(res => res.json())
            .then(data => {
                if (!data.isLoggedIn || data.role !== 'EMPLOYEE') {
                    router.push('/login');
                } else {
                    setIsAuthorized(true);
                }
            })
            .catch(() => router.push('/login'));
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    if (!isAuthorized) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Carregando...</div>;
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.logo}>Banco de Horas</div>
                <button onClick={handleLogout} className={styles.logoutBtn}>
                    <LogOut size={18} /> Sair
                </button>
            </header>
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, MapPin, Briefcase, FileText, LogOut, Clock, ClipboardList, Shield } from 'lucide-react';
import styles from './admin.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        fetch('/api/auth/user')
            .then(res => res.json())
            .then(data => {
                if (!data.isLoggedIn) {
                    router.push('/login');
                } else {
                    setUser(data);
                    setIsAuthorized(true);
                }
            })
            .catch(() => router.push('/login'));
    }, [pathname, router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    if (!isAuthorized) {
        return <div className={styles.loading}>Carregando...</div>;
    }

    return (
        <div className={styles.dashboardContainer}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}>
                    <Clock size={24} />
                    <span>Banco de Horas</span>
                </div>

                <nav className={styles.nav}>
                    <Link href="/admin/dashboard" className={`${styles.navItem} ${pathname === '/admin/dashboard' ? styles.active : ''}`}>
                        <LayoutDashboard size={20} /> Dashboard
                    </Link>
                    <Link href="/admin/registros" className={`${styles.navItem} ${pathname.startsWith('/admin/registros') ? styles.active : ''}`}>
                        <FileText size={20} /> Registros
                    </Link>
                    <Link href="/admin/funcionarios" className={`${styles.navItem} ${pathname.startsWith('/admin/funcionarios') ? styles.active : ''}`}>
                        <Users size={20} /> Funcionários
                    </Link>
                    <Link href="/admin/locais" className={`${styles.navItem} ${pathname.startsWith('/admin/locais') ? styles.active : ''}`}>
                        <MapPin size={20} /> Locais
                    </Link>
                    <Link href="/admin/cargos" className={`${styles.navItem} ${pathname.startsWith('/admin/cargos') ? styles.active : ''}`}>
                        <Briefcase size={20} /> Cargos
                    </Link>
                    <Link href="/admin/relatorios" className={`${styles.navItem} ${pathname.startsWith('/admin/relatorios') ? styles.active : ''}`}>
                        <ClipboardList size={20} /> Relatórios
                    </Link>
                    {user?.role === 'ADMIN' && (
                        <Link href="/admin/usuarios" className={`${styles.navItem} ${pathname.startsWith('/admin/usuarios') ? styles.active : ''}`}>
                            <Shield size={20} /> Usuários do Sistema
                        </Link>
                    )}
                </nav>

                <div className={styles.userProfile}>
                    <div className={styles.userInfo}>
                        <p className={styles.userName}>{user?.name}</p>
                        <p className={styles.userRole}>{user?.role}</p>
                    </div>
                    <button onClick={handleLogout} className={styles.logoutButton}>
                        <LogOut size={20} />
                    </button>
                </div>
            </aside>

            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
}

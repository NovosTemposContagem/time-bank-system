'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../registrar/registrar.module.css'; // Reusing for consistent design

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ email: '', password: '' }); // 'email' is just the input key, acts as username
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const data = await res.json();
                const role = data.user.role;

                if (role === 'EMPLOYEE') {
                    router.push('/employee');
                } else {
                    router.push('/admin/dashboard');
                }
            } else {
                const data = await res.json();
                setError(data.message || 'Login falhou. Verifique suas credenciais.');
            }
        } catch {
            setError('Erro de conexão.');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Acesso ao Sistema</h1>
                <p className={styles.subtitle}>Digite seu Email (Admin) ou CPF (Colaborador)</p>

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Login</label>
                        <input
                            type="text" // changed from email to allow CPF
                            className={styles.input}
                            placeholder="Email ou CPF (apenas números)"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Senha</label>
                        <input
                            type="password"
                            className={styles.input}
                            placeholder="Sua senha ou CPF"
                            required
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button type="submit" className={styles.button}>Entrar</button>
                </form>

                {error && (
                    <div className={`${styles.message} ${styles.error}`}>
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}

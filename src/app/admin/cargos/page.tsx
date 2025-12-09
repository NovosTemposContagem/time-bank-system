'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import styles from '../dashboard/dashboard.module.css';

export default function RolesPage() {
    const [roles, setRoles] = useState<any[]>([]);
    const [newName, setNewName] = useState('');

    const fetchRoles = () => {
        fetch('/api/roles')
            .then(res => res.json())
            .then(data => setRoles(data));
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/roles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName }),
        });
        setNewName('');
        fetchRoles();
    };

    return (
        <div>
            <h1 className={styles.title} style={{ marginBottom: '1.5rem' }}>Gerenciar Cargos</h1>

            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Novo Cargo</h2>
                <form onSubmit={handleCreate} style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        placeholder="Nome do Cargo"
                        required
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--background)', color: 'white' }}
                    />
                    <button type="submit" style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> Adicionar
                    </button>
                </form>
            </div>

            <div className={styles.grid}>
                {roles.map(role => (
                    <div key={role.id} className={styles.card} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className={styles.empName}>{role.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

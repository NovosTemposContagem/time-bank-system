'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Shield, User } from 'lucide-react';
import styles from './users.module.css';

interface SystemUser {
    id: number;
    name: string;
    email: string;
    role: string;
    unit?: { name: string };
    createdAt: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('COORDINATOR');
    const [unitId, setUnitId] = useState('');

    useEffect(() => {
        fetchUsers();
        fetch('/api/units').then(res => res.json()).then(setUnits);
    }, []);

    const fetchUsers = () => {
        fetch('/api/users')
            .then(res => {
                if (res.status === 403) {
                    alert("Acesso negado.");
                    return [];
                }
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) setUsers(data);
            });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role, unitId })
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchUsers();
                // Reset form
                setName('');
                setEmail('');
                setPassword('');
                setRole('COORDINATOR');
                setUnitId('');
            } else {
                const err = await res.json();
                alert(err.message || 'Erro ao criar usuário');
            }
        } catch (error) {
            alert('Erro ao conectar com servidor');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

        try {
            const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchUsers();
            } else {
                const err = await res.json();
                alert(err.message);
            }
        } catch (error) {
            alert('Erro ao excluir');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Usuários do Sistema (Admin/Coord)</h1>
                <button className={styles.addButton} onClick={() => setIsModalOpen(true)}>
                    <Plus size={20} /> Novo Usuário
                </button>
            </div>

            <div className="card">
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Cargo</th>
                            <th>Unidade</th>
                            <th>Data Criação</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td>{u.name}</td>
                                <td>{u.email}</td>
                                <td>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                                        background: u.role === 'ADMIN' ? '#e0f2fe' : '#f3f4f6',
                                        color: u.role === 'ADMIN' ? '#0369a1' : '#374151',
                                        fontWeight: 600
                                    }}>
                                        {u.role === 'ADMIN' ? <Shield size={12} /> : <User size={12} />}
                                        {u.role === 'ADMIN' ? 'MASTER' : 'COORDENADOR'}
                                    </span>
                                </td>
                                <td>{u.unit?.name || '-'}</td>
                                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <button
                                        onClick={() => handleDelete(u.id)}
                                        className={styles.actionButton}
                                        style={{ color: '#ef4444' }}
                                        title="Excluir"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Novo Usuário Administrativo</h2>
                        <form onSubmit={handleCreate}>
                            <div className={styles.formGroup}>
                                <label>Nome</label>
                                <input
                                    className={styles.input}
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Email (Login)</label>
                                <input
                                    className={styles.input}
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Senha</label>
                                <input
                                    className={styles.input}
                                    type="password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Nível de Acesso</label>
                                <select
                                    className={styles.select}
                                    value={role}
                                    onChange={e => setRole(e.target.value)}
                                >
                                    <option value="COORDINATOR">Coordenador (Padrão)</option>
                                    <option value="ADMIN">Master (Acesso Total)</option>
                                </select>
                            </div>

                            {role === 'COORDINATOR' && (
                                <div className={styles.formGroup}>
                                    <label>Unidade (Opcional - Restringe acesso)</label>
                                    <select
                                        className={styles.select}
                                        value={unitId}
                                        onChange={e => setUnitId(e.target.value)}
                                    >
                                        <option value="">Todas as Unidades</option>
                                        {units.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.btnCancel}>Cancelar</button>
                                <button type="submit" className={styles.btnSave}>Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

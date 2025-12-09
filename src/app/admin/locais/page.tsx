'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import styles from '../dashboard/dashboard.module.css'; // Reusing some basic styles

export default function UnitsPage() {
    const [units, setUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [newAddress, setNewAddress] = useState('');
    const [msg, setMsg] = useState('');

    const fetchUnits = () => {
        fetch('/api/units')
            .then(res => res.json())
            .then(data => {
                setUnits(data);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchUnits();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este local?')) return;

        try {
            const res = await fetch(`/api/units/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setMsg('Local excluído com sucesso!');
                fetchUnits();
                setTimeout(() => setMsg(''), 3000);
            } else {
                const data = await res.json();
                setMsg(`Erro ao excluir: ${data.error || 'Erro desconhecido'}`);
            }
        } catch (error) {
            console.error(error);
            setMsg('Erro de conexão.');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg('');

        try {
            const res = await fetch('/api/units', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, address: newAddress }),
            });

            if (res.ok) {
                setNewName('');
                setNewAddress('');
                fetchUnits();
                setMsg('Local criado!');
                setTimeout(() => setMsg(''), 3000);
            } else {
                setMsg('Erro ao criar local.');
            }
        } catch (error) {
            console.error(error);
            setMsg('Erro de conexão.');
        }
    };

    return (
        <div>
            <h1 className={styles.title} style={{ marginBottom: '1.5rem' }}>Gerenciar Locais</h1>

            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Novo Local</h2>
                <form onSubmit={handleCreate} style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        placeholder="Nome da Unidade"
                        required
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--background)', color: 'white' }}
                    />
                    <input
                        placeholder="Endereço"
                        value={newAddress}
                        onChange={e => setNewAddress(e.target.value)}
                        style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--background)', color: 'white' }}
                    />
                    <button type="submit" style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> Adicionar
                    </button>
                </form>
                {msg && <p style={{ marginTop: '1rem', color: msg.includes('Erro') ? 'var(--danger)' : 'var(--success)' }}>{msg}</p>}
            </div>

            <div className={styles.grid}>
                {units.map(unit => (
                    <div key={unit.id} className={styles.card} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div className={styles.cardHeader}>
                                <span className={styles.empName}>{unit.name}</span>
                            </div>
                            <div className={styles.cardBody}>
                                <p className={styles.desc}>{unit.address || 'Sem endereço'}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDelete(unit.id)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgb(220, 38, 38)' }}
                            title="Excluir"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

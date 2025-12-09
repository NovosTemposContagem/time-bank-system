'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import styles from '../dashboard/dashboard.module.css'; // Reusing some basic styles

export default function UnitsPage() {
    const [units, setUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [newAddress, setNewAddress] = useState('');

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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/units', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName, address: newAddress }),
        });
        setNewName('');
        setNewAddress('');
        fetchUnits();
    };

    // Delete implementation skipped for brevity/safety unless requested, but added UI hook
    // const handleDelete = ...

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
            </div>

            <div className={styles.grid}>
                {units.map(unit => (
                    <div key={unit.id} className={styles.card}>
                        <div className={styles.cardHeader}>
                            <span className={styles.empName}>{unit.name}</span>
                        </div>
                        <div className={styles.cardBody}>
                            <p className={styles.desc}>{unit.address || 'Sem endereço'}</p>
                        </div>
                        {/* <button><Trash2 size={16}/></button> */}
                    </div>
                ))}
            </div>
        </div>
    );
}

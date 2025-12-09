'use client';

import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import styles from './dashboard.module.css';
import { getDurationInMinutes, formatMinutesToHM } from '@/lib/timeUtils';

export default function Dashboard() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRecords = () => {
        fetch('/api/time-records?status=PENDING')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setRecords(data);
                }
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const handleAction = async (id: number, status: 'APPROVED' | 'REJECTED') => {
        await fetch('/api/time-records', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status }),
        });
        fetchRecords(); // Refresh
    };

    if (loading) return <div>Carregando...</div>;

    return (
        <div>
            <h1 className={styles.title}>Validações Pendentes</h1>

            {records.length === 0 ? (
                <p>Nenhum registro pendente.</p>
            ) : (
                <div className={styles.grid}>
                    {records.map(record => (
                        <div key={record.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <span className={styles.empName}>{record.employee.name}</span>
                                <span className={styles.unitName}>{record.employee.unit?.name || 'N/A'}</span>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.dateRow}>
                                    <span>{new Date(record.date).toLocaleDateString()}</span>
                                    <span>{formatMinutesToHM(getDurationInMinutes(record.startTime, record.endTime))}</span>
                                </div>
                                <p className={styles.desc}>{record.description}</p>
                                <div className={styles.times}>
                                    {new Date(record.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                    {new Date(record.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                            <div className={styles.cardActions}>
                                <button onClick={() => handleAction(record.id, 'REJECTED')} className={styles.btnReject}>
                                    <X size={18} /> Rejeitar
                                </button>
                                <button onClick={() => handleAction(record.id, 'APPROVED')} className={styles.btnApprove}>
                                    <Check size={18} /> Validar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { Plus, Clock, AlertCircle } from 'lucide-react';
import styles from './employee.module.css';
import { getDurationInMinutes, formatMinutesToHM } from '@/lib/timeUtils';

export default function EmployeeDashboard() {
    const [user, setUser] = useState<any>(null);
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        date: '',
        startTime: '',
        endTime: '',
        description: ''
    });

    useEffect(() => {
        fetchUserAndRecords();
    }, []);

    const fetchUserAndRecords = async () => {
        try {
            const userRes = await fetch('/api/auth/me');
            if (userRes.ok) {
                const userData = await userRes.json();
                if (userData.isLoggedIn) {
                    setUser(userData);
                } else {
                    // Handle not logged in if necessary, though middleware/layout might handle it
                }

                // Fetch records for this employee
                // We need to support fetching "my" records.
                // The current API might need adjustment or we use the employeeId filter if we are allowed.
                // However, for security, the API should detect if user is EMPLOYEE and filter by session.
                const recRes = await fetch('/api/time-records/me'); // New endpoint or specialized query
                if (recRes.ok) {
                    setRecords(await recRes.json());
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/time-records/me', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setShowModal(false);
                setFormData({ date: '', startTime: '', endTime: '', description: '' });
                fetchUserAndRecords();
                alert('Solicitação enviada!');
            } else {
                alert('Erro ao enviar solicitação.');
            }
        } catch (error) {
            alert('Erro ao enviar.');
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Pendente';
            case 'APPROVED': return 'Aprovado';
            case 'REJECTED': return 'Rejeitado';
            default: return status;
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'PENDING': return styles.statusPending;
            case 'APPROVED': return styles.statusApproved;
            case 'REJECTED': return styles.statusRejected;
            default: return '';
        }
    };

    const totalApproved = records
        .filter(r => r.status === 'APPROVED')
        .reduce((acc, curr) => acc + getDurationInMinutes(curr.startTime, curr.endTime), 0);

    const totalPending = records
        .filter(r => r.status === 'PENDING')
        .reduce((acc, curr) => acc + getDurationInMinutes(curr.startTime, curr.endTime), 0);

    if (loading) return <div>Carregando...</div>;

    return (
        <div>
            <div className={styles.welcome}>
                <h1>Olá, {user?.name}</h1>
                <p>Gerencie seu banco de horas</p>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{formatMinutesToHM(totalApproved)}</div>
                    <div className={styles.statLabel}>Saldo Aprovado</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue} style={{ color: '#f59e0b' }}>{formatMinutesToHM(totalPending)}</div>
                    <div className={styles.statLabel}>Em Análise</div>
                </div>
            </div>

            <div className={styles.actionSection}>
                <button onClick={() => setShowModal(true)} className={styles.btnPrimary}>
                    <Plus size={20} /> Solicitar Horas
                </button>
            </div>

            <div className={styles.historySection}>
                <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Histórico</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Horário</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Observação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map(r => (
                                <tr key={r.id}>
                                    <td>{new Date(r.date).toLocaleDateString()}</td>
                                    <td>
                                        {new Date(r.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                        {new Date(r.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td>{formatMinutesToHM(getDurationInMinutes(r.startTime, r.endTime))}</td>
                                    <td className={getStatusClass(r.status)}>{getStatusLabel(r.status)}</td>
                                    <td style={{ color: '#666', fontSize: '0.9rem' }}>{r.description}</td>
                                </tr>
                            ))}
                            {records.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Nenhum registro encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2>Solicitar Horas</h2>
                        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
                            <div className={styles.formGroup}>
                                <label>Data</label>
                                <input
                                    type="date"
                                    required
                                    className={styles.input}
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className={styles.formGroup}>
                                    <label>Início</label>
                                    <input
                                        type="time"
                                        required
                                        className={styles.input}
                                        value={formData.startTime}
                                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Fim</label>
                                    <input
                                        type="time"
                                        required
                                        className={styles.input}
                                        value={formData.endTime}
                                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Motivo</label>
                                <textarea
                                    className={styles.input}
                                    style={{ minHeight: '80px', fontFamily: 'inherit' }}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.5rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}>Cancelar</button>
                                <button type="submit" className={styles.btnPrimary}>Enviar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

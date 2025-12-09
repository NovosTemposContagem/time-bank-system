'use client';

import { useState, useEffect } from 'react';
import styles from './registrar.module.css';

interface Employee {
    id: number;
    name: string;
    cpf: string;
}

export default function RegistrarPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [formData, setFormData] = useState({
        employeeId: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        description: ''
    });
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [calculatedHours, setCalculatedHours] = useState('');

    useEffect(() => {
        fetch('/api/employees/list')
            .then(res => res.json())
            .then(data => setEmployees(data))
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        if (formData.startTime && formData.endTime) {
            const start = new Date(`1970-01-01T${formData.startTime}`);
            const end = new Date(`1970-01-01T${formData.endTime}`);
            if (end > start) {
                const diff = (end.getTime() - start.getTime()) / 1000 / 60 / 60;
                setCalculatedHours(`${diff.toFixed(2)} horas`);
            } else {
                setCalculatedHours('Hora final deve ser maior que inicial');
            }
        } else {
            setCalculatedHours('');
        }
    }, [formData.startTime, formData.endTime]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus(null);

        try {
            const res = await fetch('/api/time-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setStatus({ type: 'success', message: 'Horas registradas com sucesso! Aguardando aprovação.' });
                setFormData(prev => ({ ...prev, description: '', startTime: '', endTime: '' }));
            } else {
                const data = await res.json();
                setStatus({ type: 'error', message: data.message || 'Erro ao registrar.' });
            }
        } catch (e) {
            setStatus({ type: 'error', message: 'Erro de conexão.' });
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Registro de Ponto</h1>
                <p className={styles.subtitle}>Banco de Horas - Solicitação de Hora Extra</p>

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Funcionário</label>
                        <select
                            className={styles.select}
                            required
                            value={formData.employeeId}
                            onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                        >
                            <option value="">Selecione seu nome...</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Data</label>
                        <input
                            type="date"
                            className={styles.input}
                            required
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Início</label>
                            <input
                                type="time"
                                className={styles.input}
                                required
                                value={formData.startTime}
                                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Fim</label>
                            <input
                                type="time"
                                className={styles.input}
                                required
                                value={formData.endTime}
                                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                            />
                        </div>
                    </div>

                    {calculatedHours && (
                        <div style={{ marginBottom: '1rem', textAlign: 'center', color: '#60a5fa', fontWeight: 'bold' }}>
                            Total estimado: {calculatedHours}
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Motivo / Descrição</label>
                        <textarea
                            className={styles.input}
                            rows={3}
                            required
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <button type="submit" className={styles.button}>Enviar Solicitação</button>
                </form>

                {status && (
                    <div className={`${styles.message} ${styles[status.type]}`}>
                        {status.message}
                    </div>
                )}
            </div>
        </div>
    );
}

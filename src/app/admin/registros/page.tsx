'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import styles from './registros.module.css';
import { getDurationInMinutes, formatMinutesToHM } from '@/lib/timeUtils';

export default function RegistrosPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [filters, setFilters] = useState({
        employeeId: '',
        status: ''
    });

    const [formData, setFormData] = useState({
        employeeId: '',
        date: '',
        startTime: '',
        endTime: '',
        description: '',
        status: 'PENDING'
    });

    useEffect(() => {
        fetchRecords();
        fetchEmployees();
    }, [filters]);

    const fetchRecords = async () => {
        const params = new URLSearchParams();
        if (filters.employeeId) params.append('employeeId', filters.employeeId);
        if (filters.status) params.append('status', filters.status);

        const res = await fetch(`/api/time-records?${params.toString()}`);
        const data = await res.json();
        setRecords(data);
        setLoading(false);
    };

    const fetchEmployees = async () => {
        const res = await fetch('/api/employees');
        const data = await res.json();
        setEmployees(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const method = editingRecord ? 'PUT' : 'POST';
            const body = editingRecord ? { ...formData, id: editingRecord.id } : formData;

            const res = await fetch('/api/time-records', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.message || 'Erro ao salvar');
                return;
            }

            setShowModal(false);
            setEditingRecord(null);
            resetForm();
            fetchRecords();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este registro?')) return;

        try {
            const res = await fetch(`/api/time-records?id=${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                alert('Erro ao excluir');
                return;
            }

            fetchRecords();
        } catch (error) {
            console.error(error);
            alert('Erro ao excluir');
        }
    };

    const handleEdit = (record: any) => {
        setEditingRecord(record);
        setFormData({
            employeeId: record.employeeId.toString(),
            date: new Date(record.date).toISOString().split('T')[0],
            startTime: new Date(record.startTime).toTimeString().substring(0, 5),
            endTime: new Date(record.endTime).toTimeString().substring(0, 5),
            description: record.description || '',
            status: record.status
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            employeeId: '',
            date: '',
            startTime: '',
            endTime: '',
            description: '',
            status: 'PENDING'
        });
    };

    const openNewModal = () => {
        setEditingRecord(null);
        resetForm();
        setShowModal(true);
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Pendente';
            case 'APPROVED': return 'Validado';
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

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Gerenciar Registros</h1>
                <button onClick={openNewModal} className={styles.addButton}>
                    <Plus size={20} /> Novo Registro
                </button>
            </div>

            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <label>Funcionário</label>
                    <select
                        className={styles.select}
                        value={filters.employeeId}
                        onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
                    >
                        <option value="">Todos</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <label>Status</label>
                    <select
                        className={styles.select}
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="">Todos</option>
                        <option value="PENDING">Pendentes</option>
                        <option value="APPROVED">Validados</option>
                        <option value="REJECTED">Rejeitados</option>
                    </select>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Funcionário</th>
                            <th>Entrada / Saída</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map(record => (
                            <tr key={record.id}>
                                <td>{new Date(record.date).toLocaleDateString()}</td>
                                <td>
                                    <div>{record.employee.name}</div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{record.employee.unit.name}</div>
                                </td>
                                <td>
                                    {new Date(record.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                    {new Date(record.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td>{formatMinutesToHM(getDurationInMinutes(record.startTime, record.endTime))}</td>
                                <td>
                                    <span className={`${styles.status} ${getStatusClass(record.status)}`}>
                                        {getStatusLabel(record.status)}
                                    </span>
                                </td>
                                <td>
                                    <div className={styles.actions}>
                                        <button
                                            onClick={() => handleEdit(record)}
                                            className={`${styles.actionButton} ${styles.editButton}`}
                                            title="Editar"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(record.id)}
                                            className={`${styles.actionButton} ${styles.deleteButton}`}
                                            title="Excluir"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {records.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>
                                    Nenhum registro encontrado
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>
                            {editingRecord ? 'Editar Registro' : 'Novo Registro'}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label>Funcionário</label>
                                <select
                                    required
                                    className={styles.select}
                                    style={{ width: '100%' }}
                                    value={formData.employeeId}
                                    onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                                    disabled={!!editingRecord} // Maybe allow changing employee? For now safety.
                                >
                                    <option value="">Selecione...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.rowInputs}>
                                <div className={styles.formGroup}>
                                    <label>Data</label>
                                    <input
                                        type="date"
                                        required
                                        className={styles.input}
                                        style={{ width: '100%' }}
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Status</label>
                                    <select
                                        className={styles.select}
                                        style={{ width: '100%' }}
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="PENDING">Pendente</option>
                                        <option value="APPROVED">Validado</option>
                                        <option value="REJECTED">Rejeitado</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.rowInputs}>
                                <div className={styles.formGroup}>
                                    <label>Hora Início</label>
                                    <input
                                        type="time"
                                        required
                                        className={styles.input}
                                        style={{ width: '100%' }}
                                        value={formData.startTime}
                                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Hora Fim</label>
                                    <input
                                        type="time"
                                        required
                                        className={styles.input}
                                        style={{ width: '100%' }}
                                        value={formData.endTime}
                                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Descrição / Motivo</label>
                                <textarea
                                    className={styles.input}
                                    style={{ width: '100%', minHeight: '80px', fontFamily: 'inherit' }}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className={styles.formActions}>
                                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelButton}>
                                    Cancelar
                                </button>
                                <button type="submit" className={styles.saveButton}>
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

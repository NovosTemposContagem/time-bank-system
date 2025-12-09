'use client';

import { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import styles from '../dashboard/dashboard.module.css';
import { getDurationInMinutes, formatMinutesToHM } from '@/lib/timeUtils';

interface Employee {
    id: number;
    name: string;
}

interface ReportConfig {
    startDate: string;
    endDate: string;
}

const ReportView = ({ records, employee, config }: { records: any[], employee: Employee, config: ReportConfig }) => {
    const totalMinutes = records
        .filter(r => r.status === 'APPROVED')
        .reduce((acc, curr) => {
            const mins = getDurationInMinutes(curr.startTime, curr.endTime);
            return acc + mins;
        }, 0);

    return (
        <div className="report-card" style={{ background: 'white', color: 'black', padding: '2rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', pageBreakAfter: 'always' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Extrato de Banco de Horas</h2>
                    <p style={{ fontSize: '1.2rem', fontWeight: '600', marginTop: '0.5rem' }}>{employee.name}</p>
                    <p style={{ color: '#666' }}>Período: {new Date(config.startDate).toLocaleDateString()} a {new Date(config.endDate).toLocaleDateString()}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>Total Aprovado</p>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{formatMinutesToHM(totalMinutes)}</p>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '0.5rem' }}>Data</th>
                        <th style={{ padding: '0.5rem' }}>Horário</th>
                        <th style={{ padding: '0.5rem' }}>Descrição</th>
                        <th style={{ padding: '0.5rem' }}>Status</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {records.length === 0 ? (
                        <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center' }}>Nenhum registro encontrado no período.</td></tr>
                    ) : (
                        records.map(r => (
                            <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '0.5rem' }}>{new Date(r.date).toLocaleDateString()}</td>
                                <td style={{ padding: '0.5rem' }}>
                                    {new Date(r.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                    {new Date(r.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td style={{ padding: '0.5rem' }}>{r.description}</td>
                                <td style={{ padding: '0.5rem' }}>
                                    <span style={{
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.85rem',
                                        background: r.status === 'APPROVED' ? '#d1fae5' : r.status === 'PENDING' ? '#fef3c7' : '#fee2e2',
                                        color: r.status === 'APPROVED' ? '#065f46' : r.status === 'PENDING' ? '#92400e' : '#b91c1c'
                                    }}>
                                        {r.status === 'APPROVED' ? 'Aprovado' : r.status === 'PENDING' ? 'Pendente' : 'Rejeitado'}
                                    </span>
                                </td>
                                <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>
                                    {formatMinutesToHM(getDurationInMinutes(r.startTime, r.endTime))}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default function ReportsPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmp, setSelectedEmp] = useState('');
    const [records, setRecords] = useState<any[]>([]); // Current single employee records
    const [filteredRecords, setFilteredRecords] = useState<any[]>([]); // Current single employee filtered

    const [viewAll, setViewAll] = useState(false);
    const [allRecords, setAllRecords] = useState<any[]>([]); // For bulk view

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(lastDay.toISOString().split('T')[0]);

        fetch('/api/employees').then(res => res.json()).then(setEmployees);
    }, []);

    // Single Employee Fetch
    useEffect(() => {
        if (selectedEmp && !viewAll) {
            fetch(`/api/time-records?employeeId=${selectedEmp}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setRecords(data);
                    }
                });
        }
    }, [selectedEmp, viewAll]);

    // View All Fetch
    useEffect(() => {
        if (viewAll) {
            fetch('/api/time-records')
                .then(res => res.json())
                .then(setAllRecords);
        }
    }, [viewAll]);

    // Filter Logic
    const getFilteredData = (data: any[], start: string, end: string) => {
        if (!start || !end) return data;
        const startD = new Date(start);
        const endD = new Date(end);
        endD.setHours(23, 59, 59, 999);
        return data.filter(r => {
            const d = new Date(r.date);
            return d >= startD && d <= endD;
        });
    };

    // Update single view
    useEffect(() => {
        if (!viewAll) {
            setFilteredRecords(getFilteredData(records, startDate, endDate));
        }
    }, [startDate, endDate, records, viewAll]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="report-container">
            <div className="no-print">
                <h1 className={styles.title}>Relatórios e Extrato</h1>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', background: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                Funcionário
                            </label>
                            <input
                                list="employees-list"
                                placeholder={viewAll ? "Visualizando todos" : "Digite para buscar..."}
                                disabled={viewAll}
                                value={viewAll ? '' : undefined}
                                onChange={e => {
                                    const val = e.target.value;
                                    const found = employees.find(emp => emp.name === val);
                                    if (found) setSelectedEmp(found.id.toString());
                                    else setSelectedEmp('');
                                }}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid #ddd',
                                    opacity: viewAll ? 0.5 : 1
                                }}
                            />
                            <datalist id="employees-list">
                                {[...employees]
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map(e => <option key={e.id} value={e.name} />)
                                }
                            </datalist>
                        </div>
                    </div>

                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Data Inicial</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid #ddd' }}
                        />
                    </div>

                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Data Final</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid #ddd' }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button
                            onClick={() => setViewAll(!viewAll)}
                            style={{
                                padding: '0.6rem 1rem',
                                background: viewAll ? 'var(--primary)' : 'transparent',
                                border: '1px solid var(--primary)',
                                color: viewAll ? 'white' : 'var(--primary)',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            {viewAll ? 'Filtrar Individual' : 'Imprimir Todos'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Single Report View */}
            {!viewAll && selectedEmp && (
                <div>
                    <ReportView
                        records={filteredRecords}
                        employee={employees.find(e => e.id.toString() === selectedEmp)!}
                        config={{ startDate, endDate }}
                    />
                    <div className="no-print" style={{ marginTop: '2rem', textAlign: 'right' }}>
                        <button onClick={handlePrint} className={styles.btnApprove} style={{ display: 'inline-flex', width: 'auto' }}>
                            <Printer size={18} style={{ marginRight: '0.5rem' }} /> Imprimir Extrato
                        </button>
                    </div>
                </div>
            )}

            {/* All Reports View */}
            {viewAll && (
                <div>
                    {employees.sort((a, b) => a.name.localeCompare(b.name)).map(emp => {
                        const empRecords = allRecords.filter(r => r.employeeId === emp.id);
                        const empFiltered = getFilteredData(empRecords, startDate, endDate);
                        return (
                            <ReportView
                                key={emp.id}
                                records={empFiltered}
                                employee={emp}
                                config={{ startDate, endDate }}
                            />
                        );
                    })}
                    <div className="no-print" style={{ marginTop: '2rem', textAlign: 'right', position: 'sticky', bottom: '2rem' }}>
                        <button onClick={handlePrint} className={styles.btnApprove} style={{ display: 'inline-flex', width: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                            <Printer size={18} style={{ marginRight: '0.5rem' }} /> Imprimir Todos
                        </button>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @media print {
                  .no-print {
                    display: none !important;
                  }
                  body {
                    background: white !important;
                    color: black !important;
                    -webkit-print-color-adjust: exact;
                  }
                  .report-container {
                     padding: 0 !important;
                  }
                  .dashboard-container { 
                     display: block !important;
                  }
                   aside { display: none !important; }
                   main { margin-left: 0 !important; padding: 0 !important; }
                   .report-card {
                       break-inside: avoid;
                       page-break-after: always;
                       border: none !important;
                       padding: 0 !important;
                       margin-bottom: 0 !important;
                       height: auto;
                       min-height: 90vh; /* Ensure separation */
                   }
                }
            `}</style>
        </div>
    );
}

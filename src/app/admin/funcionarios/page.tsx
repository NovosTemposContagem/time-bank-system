'use client';

import { useState, useEffect } from 'react';
import { Plus, Upload, Trash2 } from 'lucide-react';
import styles from '../dashboard/dashboard.module.css';
import * as XLSX from 'xlsx';

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);

    const [form, setForm] = useState({ name: '', cpf: '', unitId: '', roleId: '' });
    const [msg, setMsg] = useState('');

    // Import State
    const [showImport, setShowImport] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importConfig, setImportConfig] = useState({ unitId: '', roleId: '' });
    const [importMsg, setImportMsg] = useState('');

    const fetchData = async () => {
        fetch('/api/employees').then(res => res.json()).then(setEmployees);
        fetch('/api/units').then(res => res.json()).then(setUnits);
        fetch('/api/roles').then(res => res.json()).then(setRoles);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este funcionário?')) return;

        try {
            const res = await fetch(`/api/employees/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setMsg('Funcionário excluído com sucesso!');
                fetchData();
                setTimeout(() => setMsg(''), 3000);
            } else {
                const data = await res.json();
                setMsg(`Erro ao excluir: ${data.error || 'Erro desconhecido'}`);
            }
        } catch (error) {
            console.error('Error deleting:', error);
            setMsg('Erro de conexão ao tentar excluir.');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg('');

        const cleanForm = {
            ...form,
            cpf: form.cpf.replace(/\D/g, '')
        };

        const res = await fetch('/api/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cleanForm),
        });

        if (res.ok) {
            setForm({ name: '', cpf: '', unitId: '', roleId: '' });
            fetchData();
            setMsg('Funcionário criado!');
            setTimeout(() => setMsg(''), 3000);
        } else {
            setMsg('Erro ao criar (CPF já existe ou inválido).');
        }
    };

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile || !importConfig.unitId || !importConfig.roleId) {
            setImportMsg('Preencha todos os campos e selecione o arquivo.');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data: any[] = XLSX.utils.sheet_to_json(ws);

                // Expected columns: NOME, CPF
                const mapped = data.map(row => ({
                    name: row['NOME'] || row['Nome'] || row['name'],
                    cpf: String(row['CPF'] || row['Cpf'] || row['cpf']).replace(/\D/g, '')
                })).filter(r => r.name && r.cpf);

                if (mapped.length === 0) {
                    setImportMsg('Nenhum dado válido encontrado. Verifique as colunas NOME e CPF.');
                    return;
                }

                const res = await fetch('/api/employees/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        employees: mapped,
                        defaultUnitId: importConfig.unitId,
                        defaultRoleId: importConfig.roleId
                    })
                });

                const result = await res.json();
                if (res.ok) {
                    setImportMsg(`Sucesso! ${result.count} importados.`);
                    if (result.errors.length > 0) {
                        alert(`Alguns erros: \n${result.errors.map((e: any) => `${e.name}: ${e.error}`).join('\n')}`);
                    }
                    setTimeout(() => {
                        setShowImport(false);
                        setImportMsg('');
                        fetchData();
                    }, 2000);
                } else {
                    setImportMsg('Erro na importação.');
                }

            } catch (err) {
                console.error(err);
                setImportMsg('Erro ao ler arquivo.');
            }
        };
        reader.readAsBinaryString(importFile);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 className={styles.title}>Gerenciar Funcionários</h1>
                <button
                    onClick={() => setShowImport(true)}
                    style={{ padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}
                >
                    <Upload size={18} /> Importar Excel
                </button>
            </div>

            {showImport && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', minWidth: '400px' }}>
                        <h2 style={{ marginBottom: '1.5rem', fontWeight: 'bold' }}>Importar Funcionários</h2>
                        <form onSubmit={handleImport}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Arquivo Excel (.xlsx)</label>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={e => setImportFile(e.target.files ? e.target.files[0] : null)}
                                    required
                                />
                                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Colunas necessárias: NOME, CPF</p>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Unidade Padrão</label>
                                <select
                                    required
                                    style={{ width: '100%', padding: '0.5rem' }}
                                    value={importConfig.unitId}
                                    onChange={e => setImportConfig({ ...importConfig, unitId: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Cargo Padrão</label>
                                <select
                                    required
                                    style={{ width: '100%', padding: '0.5rem' }}
                                    value={importConfig.roleId}
                                    onChange={e => setImportConfig({ ...importConfig, roleId: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>

                            {importMsg && <p style={{ marginBottom: '1rem', color: importMsg.includes('Erro') ? 'red' : 'green' }}>{importMsg}</p>}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowImport(false)} style={{ padding: '0.5rem 1rem', background: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Importar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Novo Funcionário</h2>
                <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Nome</label>
                        <input
                            required
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--background)', color: 'white' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>CPF</label>
                        <input
                            required
                            value={form.cpf}
                            onChange={e => setForm({ ...form, cpf: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--background)', color: 'white' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Locais</label>
                        <select
                            required
                            value={form.unitId}
                            onChange={e => setForm({ ...form, unitId: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--background)', color: 'white' }}
                        >
                            <option value="">Selecione...</option>
                            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Cargo</label>
                        <select
                            required
                            value={form.roleId}
                            onChange={e => setForm({ ...form, roleId: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--background)', color: 'white' }}
                        >
                            <option value="">Selecione...</option>
                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>

                    <button type="submit" style={{ height: '38px', padding: '0 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> Adicionar
                    </button>
                </form>
                {msg && <p style={{ marginTop: '1rem', color: msg.includes('Erro') ? 'var(--danger)' : 'var(--success)' }}>{msg}</p>}
            </div>

            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Nome</th>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>CPF</th>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Cargo</th>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Unidade</th>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => (
                            <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{emp.name}</td>
                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{emp.cpf}</td>
                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{emp.role?.name}</td>
                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{emp.unit?.name}</td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <button
                                        onClick={() => handleDelete(emp.id)}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgb(220, 38, 38)' }}
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
        </div>
    );
}

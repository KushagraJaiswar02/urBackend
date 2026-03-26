import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { UploadCloud, Trash2, File, ExternalLink, HardDrive, AlertTriangle } from 'lucide-react';
import { API_URL } from '../config';

export default function Storage() {
    const { projectId } = useParams();
    const { user } = useAuth();

    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deletingAll, setDeletingAll] = useState(false);
    const fileInputRef = useRef(null);

    // 1. Fetch Files
    const fetchFiles = useCallback(async () => {
        try {
            const res = await api.get(`/api/projects/${projectId}/storage/files`);
            setFiles(res.data);
        } catch {
            toast.error("Failed to load files");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchFiles();
    }, [projectId, fetchFiles]);

    // 2. Handle File Upload
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!user?.isVerified) {
            toast.error("Account Verification Required. Please verify in Settings.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        const toastId = toast.loading("Uploading...");

        try {
            await api.post(`/api/projects/${projectId}/storage/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            toast.success("File uploaded!", { id: toastId });
            fetchFiles();
        } catch (err) {
            const backendError = err.response?.data?.error || "Upload failed";
            toast.error(backendError, { id: toastId });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // 3. Handle Single Delete
    const handleDelete = async (path) => {
        if (!user?.isVerified) {
            toast.error("Account Verification Required.");
            return;
        }
        if (!confirm("Delete this file permanently?")) return;

        try {
            await api.post(`/api/projects/${projectId}/storage/delete`,
                { path }
            );
            setFiles(files.filter(f => f.path !== path));
            toast.success("File deleted");
        } catch {
            toast.error("Failed to delete file");
        }
    };

    // 4. Handle Delete ALL (New Feature)
    const handleDeleteAll = async () => {
        if (!user?.isVerified) {
            toast.error("Account Verification Required.");
            return;
        }
        const confirmMsg = prompt(`Type "DELETE" to confirm wiping all ${files.length} files.`);
        if (confirmMsg !== "DELETE") return;

        setDeletingAll(true);
        try {
            await api.delete(`/api/projects/${projectId}/storage/files`);
            setFiles([]);
            toast.success("All files deleted.");
        } catch {
            toast.error("Failed to clear storage");
        } finally {
            setDeletingAll(false);
        }
    };

    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    if (loading) return <div className="container">Loading Storage...</div>;

    return (
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
            {/* Header */}
            <div className="page-header" style={{ marginBottom: '2.5rem', borderBottom: 'none' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '2rem', marginBottom: '0.5rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <HardDrive size={28} color="var(--color-primary)" /> Storage
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Manage your project's media and assets safely.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {files.length > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            className="btn btn-danger"
                            disabled={deletingAll}
                            style={{ background: 'rgba(234, 84, 85, 0.1)', color: '#ea5455', border: '1px solid rgba(234, 84, 85, 0.2)' }}
                        >
                            {deletingAll ? 'Deleting...' : <><AlertTriangle size={16} /> Delete All</>}
                        </button>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                    />
                    <button
                        onClick={() => fileInputRef.current.click()}
                        className="btn btn-primary"
                        disabled={uploading}
                    >
                        <UploadCloud size={18} /> {uploading ? 'Uploading...' : 'Upload File'}
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {files.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '6rem 2rem', borderStyle: 'dashed', background: 'transparent' }}>
                    <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'var(--color-bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', border: '1px solid var(--color-border)' }}>
                        <HardDrive size={32} style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No files uploaded</h3>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem auto' }}>
                        Upload images, documents, or any other assets to your storage bucket.
                    </p>
                    <button onClick={() => fileInputRef.current.click()} className="btn btn-secondary">
                        Upload your first file
                    </button>
                </div>
            ) : (
                /* File Grid */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
                    {files.map((file) => {
                        const isImage = file.metadata?.mimetype?.startsWith('image/');
                        return (
                            <div key={file.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', border: '1px solid var(--color-border)' }}>
                                {/* Preview Area */}
                                <div className="file-preview" style={{
                                    height: '160px',
                                    backgroundColor: 'var(--color-bg-input)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderBottom: '1px solid var(--color-border)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {isImage ? (
                                        <img src={file.publicUrl} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} />
                                    ) : (
                                        <File size={48} style={{ opacity: 0.2, color: '#fff' }} />
                                    )}
                                </div>

                                {/* Details Area */}
                                <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-bg-card)' }}>
                                    <div style={{ fontWeight: 500, marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9rem', color: 'var(--color-text-main)' }} title={file.name}>
                                        {file.name.split('_').slice(1).join('_') || file.name}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <span>{formatBytes(file.metadata?.size)}</span>
                                        <span style={{ textTransform: 'uppercase', fontSize: '0.7rem', background: 'var(--color-bg-input)', padding: '2px 6px', borderRadius: '4px' }}>
                                            {file.metadata?.mimetype?.split('/')[1] || 'FILE'}
                                        </span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                                        <a
                                            href={file.publicUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="btn btn-sm"
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '0.4rem',
                                                background: 'var(--color-bg-input)',
                                                color: 'var(--color-text-main)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '6px',
                                                textDecoration: 'none'
                                            }}
                                        >
                                            <ExternalLink size={14} style={{ marginRight: '4px' }} /> View
                                        </a>
                                        <button
                                            onClick={() => handleDelete(file.path)}
                                            className="btn btn-sm"
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '0.4rem',
                                                background: 'rgba(234, 84, 85, 0.1)',
                                                color: '#ea5455',
                                                border: '1px solid rgba(234, 84, 85, 0.2)',
                                                borderRadius: '6px'
                                            }}
                                        >
                                            <Trash2 size={14} style={{ marginRight: '4px' }} /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`
                .file-preview:hover img { transform: scale(1.05); }
            `}</style>
        </div>
    );
}
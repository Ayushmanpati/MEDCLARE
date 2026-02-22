import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getReport, processReport } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import TextToSpeech from '../components/TextToSpeech';

function MedicationsTable({ medications }) {
    const { t } = useTranslation();
    if (!medications || medications.length === 0) return null;

    return (
        <div className="findings-container">
            <div className="findings-header">
                <h2 className="findings-title">💊 {t('report.tabs.medications')}</h2>
                <span className="badge badge-purple">{medications.length} {t('common.items') || 'items'}</span>
            </div>
            <table className="findings-table">
                <thead>
                    <tr>
                        <th>{t('report.table.parameter')}</th>
                        <th>{t('report.dosage')}</th>
                        <th>{t('report.frequency')}</th>
                        <th>{t('report.duration')}</th>
                        <th>{t('report.instructions') || 'Instructions'}</th>
                    </tr>
                </thead>
                <tbody>
                    {medications.map((m, i) => (
                        <tr key={i}>
                            <td style={{ fontWeight: 600, color: 'var(--color-accent-blue)' }}>{m.name}</td>
                            <td>{m.dosage || 'N/A'}</td>
                            <td>{m.frequency || 'N/A'}</td>
                            <td>{m.duration || 'N/A'}</td>
                            <td style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-secondary)' }}>{m.instructions || 'None'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function FindingsTable({ findings }) {
    const { t } = useTranslation();
    if (!findings || findings.length === 0) return null;

    const grouped = {};
    findings.forEach(f => {
        const cat = f.category || 'General';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(f);
    });

    return (
        <div className="findings-container">
            <div className="findings-header">
                <h2 className="findings-title">🔬 {t('report.tabs.findings')}</h2>
                <span className="badge badge-info">{findings.length} {t('common.parameters') || 'parameters'}</span>
            </div>
            {Object.entries(grouped).map(([category, catFindings]) => (
                <div key={category} style={{ marginBottom: 'var(--space-6)' }}>
                    <h3 style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {t(`report.categories.${category.toLowerCase().replace(/\s+/g, '_')}`) || category}
                    </h3>
                    <table className="findings-table">
                        <thead>
                            <tr>
                                <th>{t('report.table.parameter')}</th>
                                <th>{t('report.table.value')}</th>
                                <th>{t('report.table.range')}</th>
                                <th>{t('report.table.status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {catFindings.map((f, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 500 }}>{f.test_name}</td>
                                    <td>
                                        <span className={`finding-value ${f.status}`}>
                                            {f.value} <span style={{ fontWeight: 400, opacity: 0.7 }}>{f.unit}</span>
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--color-text-muted)' }}>{f.reference_range || 'N/A'}</td>
                                    <td>
                                        <span className={`badge badge-${f.status}`}>
                                            {f.status === 'normal' ? `✓ ${t('report.status.normal') || 'Normal'}` :
                                                f.status === 'critical' ? `⚠ ${t('report.status.critical') || 'Critical'}` :
                                                    f.status === 'high' ? `↑ ${t('report.status.high') || 'High'}` :
                                                        `↓ ${t('report.status.low') || 'Low'}`}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
}

function ExplanationPanel({ sections, citations, explanationText }) {
    const { t, i18n } = useTranslation();
    if (!sections && !explanationText) return null;

    // Map i18n language codes to BCP 47 for TTS
    const langMap = {
        'en': 'en-US',
        'hi': 'hi-IN',
        'te': 'te-IN',
        'ta': 'ta-IN',
        'or': 'or-IN',
        'ml': 'ml-IN',
        'bn': 'bn-IN',
        'pa': 'pa-IN',
        'mr': 'mr-IN'
    };
    const ttsLang = langMap[i18n.language] || 'en-US';

    return (
        <div className="explanation-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h2 className="findings-title" style={{ marginBottom: 0 }}>📋 {t('report.tabs.explanation')}</h2>
                <TextToSpeech text={explanationText || sections?.map(s => `${s.title}: ${s.content}`).join(' ')} language={ttsLang} />
            </div>

            {explanationText && (
                <div className="card" style={{ marginBottom: 'var(--space-4)', fontFamily: 'var(--font-serif)', lineHeight: 1.8, fontSize: 'var(--fs-sm)', color: 'var(--color-text-secondary)' }}>
                    {explanationText}
                </div>
            )}

            {sections && sections.map((section, i) => (
                <div key={i} className={`explanation-section severity-${section.severity || 'normal'}`}>
                    <h3 className="explanation-section-title">
                        {section.severity === 'concern' ? '⚠️' : section.severity === 'attention' ? '⚡' : '✓'} {section.title}
                    </h3>
                    <div className="explanation-section-content">{section.content}</div>
                    {section.findings_covered && (
                        <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                            {section.findings_covered.map((f, j) => (
                                <span key={j} className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{f}</span>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            {citations && citations.length > 0 && (
                <div className="card" style={{ marginTop: 'var(--space-4)' }}>
                    <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--color-text-muted)' }}>
                        📑 {t('report.sourcesCitations')}
                    </h4>
                    {citations.map((c, i) => (
                        <div key={i} style={{ marginBottom: 'var(--space-3)', paddingLeft: 'var(--space-4)', borderLeft: '2px solid var(--color-border)', fontSize: 'var(--fs-xs)', color: 'var(--color-text-secondary)' }}>
                            <strong style={{ color: 'var(--color-accent-blue)' }}>[{c.id || i + 1}]</strong> {c.source && <em>({c.source})</em>} {c.text}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ConfidencePanel({ scores }) {
    const { t } = useTranslation();
    if (!scores) return null;
    const overall = Math.round((scores.overall || 0) * 100);
    const quality = scores.quality_label || 'moderate';

    return (
        <div className="confidence-container">
            <h2 className="findings-title" style={{ marginBottom: 'var(--space-4)' }}>📊 {t('report.confidenceAssessment') || 'Confidence Assessment'}</h2>
            <div className="card confidence-overall">
                <div className={`confidence-ring ${quality}`} style={{ '--pct': overall }}>
                    <span>{overall}%</span>
                </div>
                <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--fs-lg)', marginBottom: 'var(--space-1)' }}>
                        {quality === 'high' ? t('report.confidence.high') || 'High Confidence' :
                            quality === 'moderate' ? t('report.confidence.moderate') || 'Moderate Confidence' :
                                t('report.confidence.low') || 'Low Confidence'}
                    </div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--fs-sm)' }}>
                        {t('report.confidenceDesc')}
                    </div>
                </div>
            </div>
            {scores.stages && (
                <div className="confidence-stages">
                    {Object.entries(scores.stages).map(([key, val]) => (
                        <div key={key} className="confidence-stage">
                            <div className="confidence-stage-label">{t(`upload.pipeline.${key}`) || key.toUpperCase()}</div>
                            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                                {Math.round(val * 100)}%
                            </div>
                            <div className="confidence-stage-bar">
                                <div className="confidence-stage-fill" style={{
                                    width: `${val * 100}%`,
                                    background: val >= 0.8 ? 'var(--color-accent-green)' : val >= 0.6 ? 'var(--color-accent-amber)' : 'var(--color-accent-red)'
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function VerificationStatus({ report }) {
    const { t } = useTranslation();
    if (!report.verification_status && report.status !== 'explained') return null;

    const isVerified = report.verification_status === 'approved';
    const isRejected = report.verification_status === 'rejected' || report.verification_status === 'reject';
    const isPending = !report.verification_status && report.status === 'explained';

    return (
        <div className={`verification-panel ${isVerified ? 'verification-approved' : isPending ? 'verification-pending' : 'verification-rejected'}`}>
            <div className="verification-header">
                <div className="verification-icon" style={{
                    background: isVerified ? 'var(--color-accent-green-dim)' : isPending ? 'var(--color-accent-amber-dim)' : 'var(--color-accent-red-dim)',
                    color: isVerified ? 'var(--color-accent-green)' : isPending ? 'var(--color-accent-amber)' : 'var(--color-accent-red)'
                }}>
                    {isVerified ? '✓' : isPending ? '⏳' : '✗'}
                </div>
                <div>
                    <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 600 }}>
                        {isVerified ? t('report.doctorVerified') : isPending ? t('report.pendingVerification') || 'Pending Verification' : t('report.needsRevision') || 'Needs Revision'}
                    </h3>
                    <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-secondary)' }}>
                        {isVerified
                            ? `${t('report.verifiedOn') || 'Verified on'} ${new Date(report.verified_at).toLocaleDateString()}`
                            : isPending
                                ? t('report.pendingDesc') || 'This interpretation is awaiting professional review'
                                : t('report.rejectedDesc') || 'A healthcare professional has requested changes'}
                    </p>
                </div>
            </div>
            {report.doctor_notes && (
                <div style={{ padding: 'var(--space-4)', background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-md)', fontSize: 'var(--fs-sm)', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                    "{report.doctor_notes}"
                </div>
            )}
        </div>
    );
}

export default function ReportView() {
    const { id } = useParams();
    const { user } = useAuth();
    const { t, i18n } = useTranslation();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reprocessing, setReprocessing] = useState(false);

    useEffect(() => {
        getReport(id)
            .then(res => setReport(res.data))
            .catch(err => setError(err.response?.data?.detail || t('common.error')))
            .finally(() => setLoading(false));
    }, [id, t]);

    const handleRegenerate = async () => {
        setReprocessing(true);
        try {
            const res = await processReport(id, report.personalization_level, i18n.language);
            setReport(res.data);
        } catch (err) {
            alert(err.response?.data?.detail || t('common.error'));
        } finally {
            setReprocessing(false);
        }
    };

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
    if (error) return (
        <div className="page"><div className="container">
            <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                <p style={{ color: 'var(--color-accent-red)' }}>{error}</p>
                <Link to="/dashboard" className="btn btn-ghost" style={{ marginTop: '1rem' }}>{t('report.backToReports')}</Link>
            </div>
        </div></div>
    );

    const langMismatch = report.lang && report.lang !== i18n.language;

    return (
        <div className="page">
            <div className="container">
                {/* Report Header */}
                <div className="report-header">
                    <div className="report-header-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                            <Link to="/dashboard" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--fs-sm)' }}>← {t('navbar.reports')}</Link>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h1>{report.title}</h1>
                            {langMismatch && (
                                <button
                                    className="btn btn-primary"
                                    onClick={handleRegenerate}
                                    disabled={reprocessing}
                                    style={{ fontSize: 'var(--fs-xs)', padding: '0.4rem 0.8rem' }}
                                >
                                    {reprocessing ? t('common.loading') : `✨ ${t('upload.analyzeBtn')}`}
                                </button>
                            )}
                        </div>
                        <div className="report-meta">
                            <span className="report-meta-item">📅 {new Date(report.created_at).toLocaleDateString()}</span>
                            <span className={`badge status-${report.status}`}>{t(`upload.pipeline.${report.status}`) || report.status}</span>
                            <span className="badge badge-ghost" style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                {report.report_type?.replace('_', ' ')}
                            </span>
                            {report.ocr_confidence && (
                                <span className="report-meta-item">🔍 {t('upload.pipeline.ocr')}: {Math.round(report.ocr_confidence * 100)}%</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 1. Verification Status */}
                <VerificationStatus report={report} />

                {/* 2. Structured Findings / Medications */}
                {report.report_type === 'prescription' ? (
                    <MedicationsTable medications={report.medications} />
                ) : (
                    <FindingsTable findings={report.findings} />
                )}

                {/* 3. Grounded Explanation */}
                <ExplanationPanel
                    sections={report.explanation_sections}
                    citations={report.citations}
                    explanationText={report.explanation_text}
                />

                {/* 4. Confidence Assessment */}
                <ConfidencePanel scores={report.confidence_scores} />

                {/* 5. Guardrail Flags */}
                {report.guardrail_flags && report.guardrail_flags.length > 0 && (
                    <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
                        <h3 style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--color-text-muted)' }}>
                            🛡️ {t('report.trustSafety')}
                        </h3>
                        {report.guardrail_flags.map((flag, i) => (
                            <div key={i} style={{
                                padding: 'var(--space-3)', marginBottom: 'var(--space-2)',
                                background: flag.severity === 'warning' ? 'var(--color-accent-amber-dim)' : 'var(--color-accent-blue-dim)',
                                borderRadius: 'var(--radius-md)', fontSize: 'var(--fs-xs)'
                            }}>
                                <strong style={{ color: flag.severity === 'warning' ? 'var(--color-accent-amber)' : 'var(--color-accent-blue)' }}>
                                    {flag.type}
                                </strong>: {flag.message}
                            </div>
                        ))}
                    </div>
                )}

                {/* 6. Disclaimer */}
                <div className="disclaimer">
                    <span className="disclaimer-icon">⚠️</span>
                    <div>
                        <strong style={{ color: 'var(--color-accent-amber)' }}>{t('report.disclaimerTitle') || 'Medical Disclaimer'}</strong>
                        <p style={{ marginTop: 'var(--space-1)' }}>
                            {t('report.disclaimerDesc') || 'This interpretation is generated by an AI system...'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

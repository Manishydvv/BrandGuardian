/**
 * Brand Guardian AI — Frontend Logic
 * Handles audit submission, progress animation, and results display.
 */

const API_BASE = window.location.origin;

// ===== DOM ELEMENTS =====
const inputSection = document.getElementById('input-section');
const processingSection = document.getElementById('processing-section');
const resultsSection = document.getElementById('results-section');
const errorSection = document.getElementById('error-section');
const urlInput = document.getElementById('video-url');
const auditBtn = document.getElementById('audit-btn');
const inputError = document.getElementById('input-error');

// ===== VALIDATE URL =====
function isValidYouTubeUrl(url) {
    return url && (url.includes('youtube.com') || url.includes('youtu.be'));
}

// ===== START AUDIT =====
async function startAudit() {
    const videoUrl = urlInput.value.trim();

    // Validate
    if (!isValidYouTubeUrl(videoUrl)) {
        inputError.textContent = 'Please enter a valid YouTube URL.';
        urlInput.focus();
        return;
    }

    inputError.textContent = '';
    auditBtn.disabled = true;

    // Show processing
    showSection('processing');
    animateSteps();

    try {
        const response = await fetch(`${API_BASE}/audit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ video_url: videoUrl })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || `Server error (${response.status})`);
        }

        const data = await response.json();
        showResults(data);

    } catch (err) {
        showError(err.message);
    } finally {
        auditBtn.disabled = false;
    }
}

// ===== SHOW RESULTS =====
function showResults(data) {
    const isPassed = data.status === 'PASS';
    const violations = data.compliance_results || [];

    // Status Banner
    const banner = document.getElementById('status-banner');
    banner.className = `status-banner ${isPassed ? 'pass' : 'fail'}`;

    document.getElementById('status-icon').textContent = isPassed ? '✓' : '✕';
    document.getElementById('status-title').textContent = isPassed
        ? 'PASS — No Violations Found'
        : `FAIL — ${violations.length} Violation(s) Detected`;
    document.getElementById('status-sub').textContent =
        `Session: ${data.session_id} · Video: ${data.video_id}`;

    // Violations
    const violationCount = document.getElementById('violation-count');
    const violationsList = document.getElementById('violations-list');
    violationCount.textContent = violations.length;

    if (violations.length === 0) {
        violationsList.innerHTML = '<div class="no-violations">✓ No compliance violations detected</div>';
    } else {
        violationsList.innerHTML = violations.map(v => {
            const severity = (v.severity || 'WARNING').toUpperCase();
            const severityClass = severity === 'CRITICAL' ? 'critical' : 'warning';
            return `
                <div class="violation-item">
                    <div class="violation-header">
                        <span class="severity-tag ${severityClass}">${severity}</span>
                        <span class="violation-category">${v.category || 'Unknown'}</span>
                    </div>
                    <p class="violation-desc">${v.description || ''}</p>
                </div>
            `;
        }).join('');
    }

    // Report
    document.getElementById('report-body').textContent = data.final_report || 'No report generated.';

    // Session JSON
    document.getElementById('session-json').textContent = JSON.stringify({
        session_id: data.session_id,
        video_id: data.video_id,
        status: data.status,
        violations_count: violations.length
    }, null, 2);

    showSection('results');
}

// ===== SHOW ERROR =====
function showError(message) {
    document.getElementById('error-message').textContent = message;
    showSection('error');
}

// ===== RESET =====
function resetAudit() {
    urlInput.value = '';
    showSection('input');
    urlInput.focus();
}

// ===== SECTION TOGGLE =====
function showSection(name) {
    inputSection.classList.toggle('hidden', name !== 'input');
    processingSection.classList.toggle('hidden', name !== 'processing');
    resultsSection.classList.toggle('hidden', name !== 'results');
    errorSection.classList.toggle('hidden', name !== 'error');
}

// ===== STEP ANIMATION =====
function animateSteps() {
    const steps = ['step-1', 'step-2', 'step-3', 'step-4'];
    let current = 0;

    const interval = setInterval(() => {
        if (current > 0) {
            document.getElementById(steps[current - 1]).classList.remove('active');
            document.getElementById(steps[current - 1]).classList.add('done');
        }
        if (current < steps.length) {
            document.getElementById(steps[current]).classList.add('active');
            current++;
        } else {
            clearInterval(interval);
        }
    }, 3000);

    // Store interval ID so we can clear it when results come back
    window._stepInterval = interval;
}

// ===== ENTER KEY =====
urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') startAudit();
});

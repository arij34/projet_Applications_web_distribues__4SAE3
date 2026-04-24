export const BLOG_DASHBOARD_STYLES = `
:host {
  display: block;
}

.page-wrapper {
  min-height: 100vh;
  background: #f0f2f5;
  position: relative;
  overflow-x: hidden;
}

.page-content {
  position: relative;
  z-index: 10;
  max-width: 1280px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-title {
  font-size: 2.75rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
}

.btn-new-project {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #1a73e8;
  color: white;
  border: none;
  border-radius: 999px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(26,115,232,0.35);
}

.btn-new-project:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(26,115,232,0.45);
}

.btn-outline {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.75rem 1.1rem;
  background: rgba(255,255,255,0.7);
  color: #334155;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.reaction-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.reaction-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  background: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reaction-btn.like {
  color: #16a34a;
}

.reaction-btn.dislike {
  color: #dc2626;
}

.reaction-btn.symbol {
  min-width: 3.6rem;
  justify-content: center;
  font-size: 0.92rem;
  font-weight: 800;
}

.reaction-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 12px rgba(15,23,42,0.08);
}

.reaction-count {
  min-width: 1.5rem;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
}

.chat-bubble {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  background: #1a73e8;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 16px 30px rgba(26,115,232,0.35);
  z-index: 40;
}

.chat-panel {
  position: fixed;
  right: 1.5rem;
  bottom: 5rem;
  width: min(380px, calc(100vw - 2rem));
  background: rgba(255,255,255,0.96);
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  box-shadow: 0 24px 60px rgba(15,23,42,0.16);
  z-index: 41;
  overflow: hidden;
}

.chat-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1rem 0.75rem;
  border-bottom: 1px solid #eef2f7;
}

.chat-panel-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #0f172a;
}

.chat-panel-header p {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: #64748b;
}

.chat-close {
  border: none;
  background: #f1f5f9;
  color: #334155;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  font-size: 1.2rem;
  cursor: pointer;
}

.chat-messages {
  max-height: 18rem;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.chat-message {
  padding: 0.75rem 0.9rem;
  border-radius: 16px;
  font-size: 0.88rem;
  line-height: 1.45;
}

.chat-message.user {
  align-self: flex-end;
  background: #1a73e8;
  color: white;
  border-bottom-right-radius: 6px;
}

.chat-message.bot {
  align-self: flex-start;
  background: #f8fafc;
  color: #0f172a;
  border: 1px solid #e2e8f0;
  border-bottom-left-radius: 6px;
}

.chat-input-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0 1rem 1rem;
}

.chat-input-row .search-input {
  flex: 1;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.5);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  transition: all 0.3s;
}

.stat-card:hover {
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.stat-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.stat-icon {
  padding: 0.75rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-indigo { background: rgba(99,102,241,0.1); color: #6366f1; }
.icon-violet { background: rgba(139,92,246,0.1); color: #8b5cf6; }
.icon-emerald { background: rgba(16,185,129,0.1); color: #10b981; }
.icon-amber { background: rgba(245,158,11,0.1); color: #f59e0b; }

.stat-badge {
  font-size: 0.7rem;
  font-weight: 600;
  color: #10b981;
  background: #f0fdf4;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.25rem 0;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  background: rgba(255,255,255,0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.4);
  border-radius: 20px;
  padding: 1rem 1.25rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.search-wrapper {
  flex: 1;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 0.625rem 0.75rem 0.625rem 2.5rem;
  border: none;
  border-radius: 12px;
  background: rgba(255,255,255,0.7);
  font-size: 0.9375rem;
  color: #0f172a;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  background: white;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
}

.selects-wrapper {
  display: flex;
  gap: 0.75rem;
}

.select-wrapper {
  position: relative;
}

.select-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
}

.custom-select {
  padding: 0.625rem 1rem 0.625rem 2.25rem;
  border: none;
  border-radius: 12px;
  background: rgba(255,255,255,0.7);
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  appearance: none;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.loading-state {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #dc2626;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.success-state {
  background: #f0fdf4;
  border: 1px solid #86efac;
  color: #15803d;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.2rem;
}

.project-card {
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.5);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  transition: all 0.3s;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

.card-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 0.8rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.card-title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.card-description {
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 64px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-label {
  font-size: 0.65rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  margin: 0;
}

.info-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  margin: 0;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(241,245,249,0.8);
  padding-top: 0.8rem;
  margin-top: auto;
  gap: 0.5rem;
}

.card-date {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.7rem;
  color: #94a3b8;
}

.card-actions {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.35rem 0.65rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
  font-size: 0.75rem;
  font-weight: 700;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(15,23,42,0.08);
}

.action-edit {
  color: #2563eb;
  border-color: #bfdbfe;
  background: #eff6ff;
}

.action-delete {
  color: #dc2626;
  border-color: #fecaca;
  background: #fef2f2;
}

.action-approve {
  color: #16a34a;
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.action-reject {
  color: #d97706;
  border-color: #fde68a;
  background: #fffbeb;
}

.admin-counter {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  border: 1px solid;
}

.like-counter {
  color: #15803d;
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.dislike-counter {
  color: #b45309;
  background: #fffbeb;
  border-color: #fde68a;
}

.badge-status {
  padding: 0.2rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid;
  white-space: nowrap;
}

.status-approved { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }
.status-pending { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
.status-rejected { background: #fef3c7; color: #d97706; border-color: #fde68a; }
.status-hidden { background: #f1f5f9; color: #475569; border-color: #e2e8f0; }

.table-shell {
  background: rgba(255,255,255,0.7);
  border: 1px solid rgba(255,255,255,0.5);
  border-radius: 20px;
  overflow: hidden;
}

.table-shell table {
  width: 100%;
  border-collapse: collapse;
}

.table-shell th,
.table-shell td {
  text-align: left;
  padding: 0.75rem;
  border-top: 1px solid #e5e7eb;
  font-size: 0.9rem;
}

.table-shell thead th {
  border-top: none;
  background: #f8fafc;
  color: #64748b;
  font-weight: 600;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.8rem;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #94a3b8;
  background: rgba(255,255,255,0.6);
  border: 1px solid rgba(255,255,255,0.4);
  border-radius: 20px;
}

@media (max-width: 1024px) {
  .project-grid { grid-template-columns: repeat(2, 1fr); }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .project-grid { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: 1fr; }
  .page-title { font-size: 2rem; }
  .filter-bar { flex-direction: column; }
  .chat-panel {
    right: 0.75rem;
    bottom: 4.5rem;
  }
}
`;

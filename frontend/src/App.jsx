import React from "react";
import './App.css'

function App() {
  return (
    <div className="app-root">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">NC</div>
          <div className="logo-text">
            <div className="logo-title">Storage 관리</div>
            <div className="logo-subtitle">Nextcloud Usage</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-title">Service</div>
          <button className="nav-item active">
            <span className="nav-icon">🏢</span>
            <span>대시보드</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">📂</span>
            <span>파일 관리</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">👥</span>
            <span>사용자</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">⚙️</span>
            <span>설정</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-footer-label">회사 관리</div>
        </div>
      </aside>

      <main className="main-layout">
        <header className="main-header">
          <div>
            <div className="header-title">스토리지 사용량 대시보드</div>
            <div className="header-subtitle">/admin/storage</div>
          </div>
        </header>
        <section className="content-area">
          <section className="cards-row">
            <div className="summary-card pink">
              <div className="summary-title">총 사용량</div>
              <div className="summary-main">테넌트별 Nextcloud 사용량</div>
              <div className="summary-footer">자동 갱신으로 실시간에 가깝게 확인</div>
            </div>
            <div className="summary-card blue">
              <div className="summary-title">자동 갱신</div>
              <div className="summary-main">30초마다 최신 데이터</div>
              <div className="summary-footer">새로고침 없이 반영</div>
            </div>
            <div className="summary-card green">
              <div className="summary-title">테넌트 선택</div>
              <div className="summary-main">tenant-a / tenant-b</div>
              <div className="summary-footer">회사 단위로 사용량 비교</div>
            </div>
            <div className="summary-card yellow">
              <div className="summary-title">사용률 색상</div>
              <div className="summary-main">안전 · 주의 · 위험</div>
              <div className="summary-footer">Progress Bar 색상으로 한눈에 확인</div>
            </div>
          </section>

          <section className="panel">
            <TenantUsagePanel />
          </section>
        </section>
      </main>
    </div>
  )
}

function TenantUsagePanel() {
  const [tenantId, setTenantId] = React.useState('tenant-a')
  const [data, setData] = React.useState({
    users: [],
    lastCollectedAt: null,
    loading: false,
    error: null,
  })

  React.useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        if (!cancelled) {
          setData((prev) => ({ ...prev, loading: true, error: null }))
        }
        const res = await fetch(`/api/admin/tenants/${tenantId}/users-usage`)
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`)
        }
        const json = await res.json()
        if (!cancelled) {
          setData({
            users: json.users || [],
            lastCollectedAt: json.lastCollectedAt || null,
            loading: false,
            error: null,
          })
        }
      } catch (err) {
        if (!cancelled) {
          setData((prev) => ({
            ...prev,
            loading: false,
            error: err.message || '데이터를 불러오지 못했습니다.',
          }))
        }
      }
    }

    fetchData()

    const intervalId = setInterval(fetchData, 30000)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [tenantId])

  const handleTenantChange = (event) => {
    setTenantId(event.target.value)
  }

  return (
    <div className="panel-inner">
      <div className="panel-header">
        <div>
          <div className="panel-title">회사별 스토리지 사용량</div>
          <div className="panel-subtitle">
            Nextcloud OCS Provisioning API 기반으로 테넌트 단위 사용량을 조회합니다.
          </div>
        </div>
        <div className="panel-controls">
          <label className="tenant-select-label">
            회사(tenant)
            <select value={tenantId} onChange={handleTenantChange} className="tenant-select">
              <option value="tenant-a">tenant-a</option>
              <option value="tenant-b">tenant-b</option>
            </select>
          </label>
          <div className="auto-refresh-label">30초마다 자동 갱신</div>
        </div>
      </div>

      <div className="panel-body">
        {data.error && <div className="alert error">오류: {data.error}</div>}
        {data.loading && <div className="loading">불러오는 중...</div>}

        <table className="usage-table">
          <thead>
            <tr>
              <th>사용자 ID</th>
              <th>사용 용량(MB)</th>
              <th>할당 용량(MB)</th>
              <th>사용률(%)</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {data.users.length === 0 && !data.loading && (
              <tr>
                <td colSpan={5} className="empty-row">
                  데이터가 없습니다.
                </td>
              </tr>
            )}
            {data.users.map((user) => {
              const usedMB = formatMB(user.usedBytes)
              const quotaMB = formatMB(user.quotaBytes)
              const percent = user.usagePercent ?? 0

              return (
                <tr key={user.userId}>
                  <td>{user.userId}</td>
                  <td>{usedMB}</td>
                  <td>{quotaMB}</td>
                  <td>{formatPercent(percent)}</td>
                  <td>
                    <UsageProgressBar percent={percent} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {data.lastCollectedAt && (
          <div className="last-updated">
            마지막 수집 시각: {new Date(data.lastCollectedAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}

function formatMB(bytes) {
  if (bytes == null) return '-'
  return (bytes / (1024 * 1024)).toFixed(1)
}

function formatPercent(value) {
  if (value == null) return '-'
  return value.toFixed(1)
}

function UsageProgressBar({ percent }) {
  let color = '#4caf50'
  if (percent >= 80) {
    color = '#f44336'
  } else if (percent >= 60) {
    color = '#ff9800'
  } else if (percent >= 30) {
    color = '#ffc107'
  }

  const normalized = Math.max(0, Math.min(100, percent || 0))

  return (
    <div className="usage-bar">
      <div className="usage-bar-fill" style={{ width: `${normalized}%`, backgroundColor: color }} />
    </div>
  )
}

export default App

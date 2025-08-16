import styles from "./ForceDirectedGraph.module.css";

interface FilterOverlayProps {
  companyQuery: string;
  onCompanyQueryChange: (value: string) => void;
  totalNodes?: number;
  displayedNodes?: number;
  maxExpenditure?: number;
  minCompanyCount: number;
  onMinCompanyCountChange: (value: number) => void;
  maxCompanyCount: number;
  fringeCompanyThreshold: number;
  onFringeCompanyThresholdChange: (value: number) => void;
  onToggleOverlay: () => void;
}

export default function FilterOverlay(props: FilterOverlayProps) {
  const {
    companyQuery,
    onCompanyQueryChange,
    totalNodes,
    displayedNodes,
    maxExpenditure,
    minCompanyCount,
    onMinCompanyCountChange,
    maxCompanyCount,
    fringeCompanyThreshold,
    onFringeCompanyThresholdChange,
    onToggleOverlay,
  } = props;

  return (
    <div className={styles.overlay}>
      {/* Close button */}
      <button
        className={styles.closeButton}
        onClick={onToggleOverlay}
        title="Close overlay"
      >
        <svg width="8" height="15" viewBox="0 0 8 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 13.5801L1 7.58008L7 1.58008" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <div className={styles.title}>California State Lobbying Expenditures</div>
      <div className={styles.subtitle}>
        Lobbying expenditures and company connections by bill in the 2025–2026 legislative session</div>
      <div className={styles.controls}>
        <input
          id="company-search"
          className={styles.input}
          placeholder="Search company, bill number, or sector"
          value={companyQuery}
          autoComplete="off"
          onChange={(e) => onCompanyQueryChange(e.target.value)}
        />
      </div>
      <div className={styles.sliderControls}>
        <label className={styles.sliderLabel}>
          <strong>Companies lobbying per bill:</strong> {minCompanyCount} or
          more
        </label>
        <input
          type="range"
          min="1"
          max={maxCompanyCount}
          value={minCompanyCount}
          onChange={(e) => onMinCompanyCountChange(parseInt(e.target.value))}
          className={styles.slider}
        />
        <div className={styles.sliderHint}>
          Only show bills lobbied by {minCompanyCount} or more companies
        </div>
      </div>
      <div className={styles.sliderControls}>
        <label className={styles.sliderLabel}>
          <strong>Hide small companies:</strong>{" "}
          {fringeCompanyThreshold >= 1000000
            ? `$${(fringeCompanyThreshold / 1000000).toFixed(1)}M`
            : fringeCompanyThreshold >= 1000
              ? `$${(fringeCompanyThreshold / 1000).toFixed(0)}K`
              : `$${fringeCompanyThreshold.toLocaleString()}`}{" "}
          or less
        </label>
        <input
          type="range"
          min="0"
          max={maxExpenditure || 5000000}
          step={Math.max(10000, Math.floor((maxExpenditure || 5000000) / 100))}
          value={Math.min(fringeCompanyThreshold, maxExpenditure || 5000000)}
          onChange={(e) =>
            onFringeCompanyThresholdChange(parseInt(e.target.value))
          }
          className={styles.slider}
        />
        <div className={styles.sliderHint}>
          Hide companies spending{" "}
          {fringeCompanyThreshold >= 1000000
            ? `$${(fringeCompanyThreshold / 1000000).toFixed(1)}M`
            : fringeCompanyThreshold >= 1000
              ? `$${(fringeCompanyThreshold / 1000).toFixed(0)}K`
              : `$${fringeCompanyThreshold.toLocaleString()}`}{" "}
          or less
        </div>
      </div>

      {totalNodes && (
        <div className={styles.nodeCount}>
          {displayedNodes === 0 ? (
            "No nodes found"
          ) : (
            <>
              Showing {displayedNodes} of {totalNodes} nodes
              {minCompanyCount > 1 && (
                <div>(bills with {minCompanyCount}+ companies)</div>
              )}
              {fringeCompanyThreshold > 0 && (
                <div>
                  (hiding companies spending ≤{" "}
                  {fringeCompanyThreshold >= 1000000
                    ? `$${(fringeCompanyThreshold / 1000000).toFixed(1)}M`
                    : fringeCompanyThreshold >= 1000
                      ? `$${(fringeCompanyThreshold / 1000).toFixed(0)}K`
                      : `$${fringeCompanyThreshold.toLocaleString()}`}
                  )
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

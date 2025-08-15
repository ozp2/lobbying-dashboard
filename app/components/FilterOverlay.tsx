import styles from "./ForceDirectedGraph.module.css";

interface FilterOverlayProps {
  companyQuery: string;
  onCompanyQueryChange: (value: string) => void;
  dollarLimit: number;
  onDollarLimitChange: (value: number) => void;
  showOnlyTopNodes: boolean;
  onShowOnlyTopNodesChange: (value: boolean) => void;
  totalNodes?: number;
  displayedNodes?: number;
  maxExpenditure?: number;
  minCompanyCount: number;
  onMinCompanyCountChange: (value: number) => void;
  maxCompanyCount: number;
  fringeCompanyThreshold: number;
  onFringeCompanyThresholdChange: (value: number) => void;
}

export default function FilterOverlay(props: FilterOverlayProps) {
  const {
    companyQuery,
    onCompanyQueryChange,
    dollarLimit,
    onDollarLimitChange,
    showOnlyTopNodes,
    onShowOnlyTopNodesChange,
    totalNodes,
    displayedNodes,
    maxExpenditure,
    minCompanyCount,
    onMinCompanyCountChange,
    maxCompanyCount,
    fringeCompanyThreshold,
    onFringeCompanyThresholdChange,
  } = props;

  return (
    <div className={styles.overlay}>
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
      <div className={styles.controls}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={showOnlyTopNodes}
            onChange={(e) => onShowOnlyTopNodesChange(e.target.checked)}
            className={styles.checkbox}
          />
          Filter by company spending
        </label>
      </div>
      {showOnlyTopNodes && (
        <div className={styles.controls}>
          <label className={styles.sliderLabel}>
            <strong>Minimum company spending:</strong>{" "}
            {dollarLimit >= 1000000
              ? `$${(dollarLimit / 1000000).toFixed(1)}M`
              : dollarLimit >= 1000
                ? `$${(dollarLimit / 1000).toFixed(0)}K`
                : `$${dollarLimit.toLocaleString()}`}
          </label>
          <input
            type="range"
            min="10000"
            max={maxExpenditure || 10000000}
            step={Math.max(
              10000,
              Math.floor((maxExpenditure || 10000000) / 100),
            )}
            value={Math.min(dollarLimit, maxExpenditure || 10000000)}
            onChange={(e) => onDollarLimitChange(parseInt(e.target.value))}
            className={styles.slider}
          />
        </div>
      )}
      {totalNodes && displayedNodes && (
        <div className={styles.nodeCount}>
          Showing {displayedNodes} of {totalNodes} nodes
          {showOnlyTopNodes && (
            <div>
              (company spending ≥{" "}
              {dollarLimit >= 1000000
                ? `$${(dollarLimit / 1000000).toFixed(1)}M`
                : dollarLimit >= 1000
                  ? `$${(dollarLimit / 1000).toFixed(0)}K`
                  : `$${dollarLimit.toLocaleString()}`}
              )
            </div>
          )}
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
        </div>
      )}
    </div>
  );
}

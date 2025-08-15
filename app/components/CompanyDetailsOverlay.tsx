"use client";

import styles from "./ForceDirectedGraph.module.css";

interface Node {
  id: string;
  label: string;
  type: "bill" | "company";
  size: number;
  billNumber?: string;
  policyCategory?: string;
  companyCount?: number;
  totalExpenditure?: number;
  title?: string;
  keyTakeaways?: string[];
  summary?: string;
  billId?: string | number;
  sector?: string;
  subcategory?: string;
  expenditure?: number;
}

interface CompanyDetailsOverlayProps {
  company: Node;
  connectedBills: Node[];
  onClose: () => void;
}

export default function CompanyDetailsOverlay({
  company,
  connectedBills,
  onClose,
}: CompanyDetailsOverlayProps) {
  const totalExpenditure = company.totalExpenditure || company.expenditure || 0;
  const billCount = connectedBills.length;

  const billsByCategory = connectedBills.reduce(
    (acc, bill) => {
      const category = bill.policyCategory || "Uncategorized";
      if (!acc[category]) acc[category] = [];
      acc[category].push(bill);
      return acc;
    },
    {} as Record<string, Node[]>,
  );

  const sortedCategories = Object.entries(billsByCategory).sort(
    ([, a], [, b]) => b.length - a.length,
  );

  return (
    <div className={styles.overlay}>
      <div className={styles.title}>{company.label}</div>

      {company.sector && (
        <div
          className={styles.subtitle}
          style={{ marginBottom: "var(--small-gap)" }}
        >
          Sector: {company.sector}
        </div>
      )}

      <div style={{ marginBottom: "var(--standard-gap)" }}>
        <strong>Lobbying Summary:</strong>
        <div>• Bills Lobbied: {billCount}</div>
        <div>• Total Expenditure: ${totalExpenditure.toLocaleString()}</div>
        {totalExpenditure > 0 && billCount > 0 && (
          <div>
            • Average per Bill: $
            {Math.round(totalExpenditure / billCount).toLocaleString()}
          </div>
        )}
      </div>

      {sortedCategories.length > 0 && (
        <div style={{ marginBottom: "var(--standard-gap)" }}>
          <strong>Policy Focus Areas:</strong>
          <div
            style={{
              maxHeight: "180px",
              overflowY: "auto",
              marginTop: "var(--mini-gap)",
              fontSize: "var(--small-font-size)",
            }}
          >
            {sortedCategories.map(([category, bills]) => (
              <div
                key={category}
                style={{
                  marginBottom: "var(--small-gap)",
                  padding: "var(--mini-gap) 0",
                }}
              >
                <div
                  style={{
                    fontWeight: "600",
                    color: "var(--main-text)",
                    marginBottom: "var(--mini-gap)",
                  }}
                >
                  {category} ({bills.length} bill{bills.length !== 1 ? "s" : ""}
                  )
                </div>
                <div
                  style={{
                    paddingLeft: "var(--small-gap)",
                    color: "var(--secondary-text)",
                    fontSize: "calc(var(--small-font-size) - 1px)",
                  }}
                >
                  {bills
                    .slice(0, 3)
                    .map((bill) => {
                      const billNum = bill.billNumber || bill.label;
                      const match = billNum.match(
                        /([A-Z]{1,3}[\\-\\s]?\\d{1,5})/,
                      );
                      return match ? match[1] : billNum.split(" ")[0];
                    })
                    .join(", ")}
                  {bills.length > 3 && ` +${bills.length - 3} more`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.controls}>
        <button
          onClick={onClose}
          style={{
            padding: "var(--dropdown-padding)",
            backgroundColor: "var(--surface)",
            color: "var(--main-text)",
            border: "1px solid var(--light-grey)",
            borderRadius: "50px",
            fontSize: "var(--small-font-size)",
            cursor: "pointer",
            fontWeight: "500",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.backgroundColor =
              "var(--light-grey)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.backgroundColor = "var(--surface)";
          }}
        >
          Back to Overview
        </button>
      </div>

      <div
        style={{
          marginTop: "var(--small-gap)",
          fontSize: "var(--small-font-size)",
          color: "var(--secondary-text)",
          fontStyle: "italic",
        }}
      >
        Click on whitespace to return to full view
      </div>
    </div>
  );
}

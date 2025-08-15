"use client";

import styles from "./ForceDirectedGraph.module.css";
import overlayStyles from "./CompanyDetailsOverlay.module.css";

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

  const sortedCategories = Object.entries(billsByCategory)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 5);

  return (
    <div className={`${styles.overlay} ${overlayStyles.overlay}`}>
      <div className={overlayStyles.title}>{company.label}</div>

      {company.sector && (
        <div className={overlayStyles.subtitle}>
          Sector: {company.sector}
        </div>
      )}

      <div className={overlayStyles.lobbyingSummary}>
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
        <div className={overlayStyles.policyFocusAreas}>
          <strong>Policy Focus Areas:</strong>
          <div className={overlayStyles.policyAreasList}>
            {sortedCategories.map(([category, bills]) => (
              <div key={category} className={overlayStyles.policyAreaItem}>
                <div className={overlayStyles.policyAreaHeader}>
                  {category} ({bills.length} bill{bills.length !== 1 ? "s" : ""}
                  )
                </div>
                <div className={overlayStyles.policyAreaBills}>
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

      <div className={overlayStyles.instructions}>
        Click on whitespace to return to full view
      </div>
    </div>
  );
}

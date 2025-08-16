"use client";

import styles from "./ForceDirectedGraph.module.css";
import overlayStyles from "./BillDetailsOverlay.module.css";
import PolicyAreaTag from "./PolicyAreaTag";

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
  expenditure?: number;
}

interface BillDetailsOverlayProps {
  bill: Node;
  connectedCompanies: Node[];
  onClose: () => void;
  onViewOnVeeto: () => void;
  onToggleOverlay: () => void;
}

export default function BillDetailsOverlay({
  bill,
  connectedCompanies,
  onViewOnVeeto,
  onToggleOverlay,
}: BillDetailsOverlayProps) {
  const totalInfluence = bill.totalExpenditure || 0;

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

      <div className={overlayStyles.titleContainer}>
        <div className={`${styles.title} ${overlayStyles.titleText}`}>
          {bill.billNumber || bill.label}
        </div>
        {bill.policyCategory && (
          <PolicyAreaTag category={bill.policyCategory} />
        )}
      </div>

      {bill.title && bill.title !== bill.label && (
        <div className={`${styles.subtitle} ${overlayStyles.subtitle}`}>
          {bill.title}
        </div>
      )}

      <div className={overlayStyles.lobbyingActivity}>
        <strong>Lobbying Activity:</strong>
        <div>• Companies: {bill.companyCount || connectedCompanies.length}</div>
        <div>• Total Influence: ${totalInfluence.toLocaleString()}</div>
      </div>

      {bill.keyTakeaways && bill.keyTakeaways.length > 0 ? (
        <div className={overlayStyles.keyTakeawaysContainer}>
          <strong>Key Takeaways:</strong>
          <ul className={overlayStyles.keyTakeawaysList}>
            {bill.keyTakeaways.map((takeaway, index) => (
              <li key={index} className={overlayStyles.keyTakeawaysItem}>
                {takeaway}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className={overlayStyles.noTakeaways}>
          No key takeaways available for this bill.
        </div>
      )}

      {bill.billId && (
        <div className={styles.controls}>
          <button onClick={onViewOnVeeto} className={overlayStyles.button}>
            View Bill Details
          </button>
        </div>
      )}

      <div className={overlayStyles.instructions}>
        Click on whitespace to return to full view
      </div>
    </div>
  );
}

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
}

export default function BillDetailsOverlay({
  bill,
  connectedCompanies,
  onViewOnVeeto,
}: BillDetailsOverlayProps) {
  const totalInfluence = bill.totalExpenditure || 0;

  return (
    <div className={styles.overlay}>
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
            View Bill Details in Veeto
          </button>
        </div>
      )}

      <div className={overlayStyles.instructions}>
        Click on whitespace to return to full view
      </div>
    </div>
  );
}

import React from "react";

import styles from "./PolicyAreaTag.module.css";

type PolicyAreaTagProps = {
  category: string | null;
};

function PolicyAreaTag({ category }: PolicyAreaTagProps) {
  // Use the same policy colors as the ForceDirectedGraph component
  const policyColors: Record<string, string> = {
    "Justice & Public Safety": "#ec619b",
    "Consumer Protection": "#fe7171",
    "Housing & Homelessness": "#ef744d",
    "Technology & Innovation": "#ed9154",
    Health: "#f9a11d",
    Education: "#f3b928",
    "Energy & Environment": "#cbb133",
    "Budget & Economy": "#9abb60",
    "Agriculture & Food": "#70b06c",
    Infrastructure: "#6bb39d",
    "Labor & Employment": "#79b4c5",
    "Natural Resources & Water": "#78a4da",
    "Government Operations": "#868fda",
    "Civil Rights & Liberties": "#9e8fd0",
    Immigration: "#b588d1",
    "Social Services": "#d37ea8",
    Uncategorized: "#8f7d75",
  };

  const resolvedKey = (() => {
    const raw = String(category || "").toLowerCase();
    if (raw.includes("health")) return "Health";
    return category as string;
  })();

  const categoryColor = policyColors[resolvedKey] || "#8f7d75";
  const displayCategory = category || "Uncategorized";

  return (
    <div
      className={styles.policyAreaTag}
      style={{ backgroundColor: categoryColor }}
    >
      <div className={styles.policyAreaTagText}>{displayCategory}</div>
    </div>
  );
}

export default React.memo(PolicyAreaTag);

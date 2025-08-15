"use client";

import styles from "./DashboardLoadingState.module.css";

export default function DashboardLoadingState() {
    return (
        <div className={styles.fullscreen}>
            <div className={styles.loading}>
                <div className={styles.loadingCard}>
                    <h2 className={styles.loadingTitle}>Loading Dashboard...</h2>
                    <p className={styles.loadingDescription}>
                        This visualization displays California Lobbyist Employer lobbying expenditures
                        from the 2025-2026 session by bill.
                    </p>
                    <ul className={styles.loadingInstructions}>
                        <li>Search by company, bill number, or sector.</li>
                        <li>Click on a bill node to see the companies that influenced it – for details, view it on<a
                            href="https://veeto.app"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.dataSourceLink}
                        > Veeto</a>
                        </li>
                        <li>Click on a lobbyist employer node to see its total lobbying expenditures and the bills it lobbied this session.</li>
                    </ul>
                    <p className={styles.loadingDescription}>Data comes from the{" "}
                        <a
                            href="https://cal-access.sos.ca.gov/Lobbying/Employers/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.dataSourceLink}
                        >
                            Secretary of State Cal-Access Website
                        </a>  and refreshes as new expenditures are reported.</p>
                </div>
            </div>
        </div>
    );
}

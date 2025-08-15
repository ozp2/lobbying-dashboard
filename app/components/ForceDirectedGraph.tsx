"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import styles from "./ForceDirectedGraph.module.css";
import FilterOverlay from "./FilterOverlay";
import BillDetailsOverlay from "./BillDetailsOverlay";
import CompanyDetailsOverlay from "./CompanyDetailsOverlay";
import BillFocusView from "./BillFocusView";
import CompanyFocusView from "./CompanyFocusView";
import DefaultView from "./DefaultView";
import DashboardLoadingState from "./DashboardLoadingState";

interface Node {
  id: string;
  label: string;
  type: "bill" | "company";
  size: number;
  billNumber?: string;
  policyCategory?: string;
  companyCount?: number;
  totalExpenditure?: number;
  companies?: any[];
  title?: string;
  keyTakeaways?: string[];
  imageUrl?: string | null;
  summary?: string;
  billId?: string | number;
  sector?: string;
  subcategory?: string;
  expenditure?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link {
  source: string;
  target: string;
  value: number;
  type: "company-bill";
  sector: string;
  company: string;
  bill: string;
  expenditure: number;
}

interface BillFocusedData {
  nodes: Node[];
  edges: Link[];
  bills: any[];
  metadata: {
    totalBills: number;
    totalCompanies: number;
    totalExpenditure: number;
    policyCategories: string[];
  };
}

export default function ForceDirectedGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<BillFocusedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string>("All");
  const [companyQuery, setCompanyQuery] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [dollarLimit, setDollarLimit] = useState<number>(2000000);
  const [showOnlyTopNodes, setShowOnlyTopNodes] = useState<boolean>(false);
  const [minCompanyCount, setMinCompanyCount] = useState<number>(10);
  const [fringeCompanyThreshold, setFringeCompanyThreshold] =
    useState<number>(500000);
  const [selectedBill, setSelectedBill] = useState<Node | null>(null);
  const [selectedCompanyNode, setSelectedCompanyNode] = useState<Node | null>(
    null,
  );
  const [isIsolationMode, setIsIsolationMode] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<
    "default" | "bill-focus" | "company-focus"
  >("default");

  const getTopNodesData = useCallback(
    (sourceData: BillFocusedData, dollarLimit: number): BillFocusedData => {
      const companies = sourceData.nodes
        .filter(
          (n) =>
            n.type === "company" &&
            (n.totalExpenditure || n.expenditure || 0) >= dollarLimit,
        )
        .sort(
          (a, b) =>
            (b.totalExpenditure || b.expenditure || 0) -
            (a.totalExpenditure || a.expenditure || 0),
        );

      const companyIds = new Set(companies.map((c) => c.id));
      const connectedBillIds = new Set<string>();

      sourceData.edges.forEach((edge) => {
        const sourceId =
          typeof edge.source === "object" && edge.source
            ? (edge.source as any).id
            : edge.source;
        const targetId =
          typeof edge.target === "object" && edge.target
            ? (edge.target as any).id
            : edge.target;

        if (companyIds.has(sourceId)) {
          connectedBillIds.add(targetId);
        } else if (companyIds.has(targetId)) {
          connectedBillIds.add(sourceId);
        }
      });

      const bills = sourceData.nodes
        .filter((n) => n.type === "bill" && connectedBillIds.has(n.id))
        .sort((a, b) => (b.totalExpenditure || 0) - (a.totalExpenditure || 0));

      const topNodes = [...companies, ...bills];
      const nodeIds = new Set(topNodes.map((n) => n.id));

      const relevantEdges = sourceData.edges.filter((e) => {
        const sourceId =
          typeof e.source === "object" && e.source
            ? (e.source as any).id
            : e.source;
        const targetId =
          typeof e.target === "object" && e.target
            ? (e.target as any).id
            : e.target;
        return (
          sourceId && targetId && nodeIds.has(sourceId) && nodeIds.has(targetId)
        );
      });

      return {
        nodes: topNodes,
        edges: relevantEdges,
        bills: sourceData.bills,
        metadata: {
          ...sourceData.metadata,
          totalBills: bills.length,
          totalCompanies: companies.length,
        },
      };
    },
    [],
  );

  const displayData: BillFocusedData | null = useMemo(() => {
    if (!data) return null;

    if (isIsolationMode && selectedBill) {
      const billNode = [selectedBill];
      const connectedEdges = data.edges.filter((e: any) => {
        const targetId = typeof e.target === "object" ? e.target.id : e.target;
        return targetId === selectedBill.id;
      });
      const connectedCompanyIds = new Set(
        connectedEdges
          .map((e) => {
            const sourceId =
              typeof e.source === "object" && e.source
                ? (e.source as any).id
                : e.source;
            return sourceId;
          })
          .filter(Boolean),
      );
      const connectedCompanies = data.nodes.filter(
        (n: any) => n.type === "company" && connectedCompanyIds.has(n.id),
      );

      return {
        nodes: [...billNode, ...connectedCompanies],
        edges: connectedEdges,
        bills: data.bills,
        metadata: {
          ...data.metadata,
          totalBills: 1,
          totalCompanies: connectedCompanies.length,
        },
      };
    } else if (viewMode === "company-focus" && selectedCompanyNode) {
      const companyNode = [selectedCompanyNode];
      const connectedEdges = data.edges.filter((e: any) => {
        const sourceId =
          typeof e.source === "object" && e.source
            ? (e.source as any).id
            : e.source;
        return sourceId === selectedCompanyNode.id;
      });
      const connectedBillIds = new Set(
        connectedEdges
          .map((e) => {
            const targetId =
              typeof e.target === "object" && e.target
                ? (e.target as any).id
                : e.target;
            return targetId;
          })
          .filter(Boolean),
      );
      const connectedBills = data.nodes.filter(
        (n: any) => n.type === "bill" && connectedBillIds.has(n.id),
      );

      return {
        nodes: [...companyNode, ...connectedBills],
        edges: connectedEdges,
        bills: data.bills,
        metadata: {
          ...data.metadata,
          totalBills: connectedBills.length,
          totalCompanies: 1,
        },
      };
    }

    const query = companyQuery.trim().toLowerCase();
    const isAllSectors = selectedSector === "All";
    const noFilters = isAllSectors && query === "";
    const hasSearchQuery = query !== "";

    let workingData = { ...data };

    // If there's a search query, skip other filters and show all search results
    if (hasSearchQuery) {
      const matchesSearch = (edge: any) => {
        const companyName = String(edge.company || "").toLowerCase();
        const sector = String(edge.sector || "").toLowerCase();
        const billId = String(edge.bill || "").toLowerCase();

        return (
          companyName.includes(query) ||
          sector.includes(query) ||
          billId.includes(query)
        );
      };

      const toId = (v: any) => (typeof v === "object" ? v.id : v);
      const filteredEdges = data.edges
        .filter((e: any) => matchesSearch(e))
        .map((e: any) => ({
          ...e,
          source: toId(e.source),
          target: toId(e.target),
        }));

      const nodeIdSet = new Set<string>();
      filteredEdges.forEach((e: any) => {
        if (e.source) nodeIdSet.add(String(e.source));
        if (e.target) nodeIdSet.add(String(e.target));
      });

      const filteredNodes = data.nodes.filter((n: any) =>
        nodeIdSet.has(String(n.id)),
      );

      return {
        nodes: filteredNodes,
        edges: filteredEdges,
        bills: data.bills,
        metadata: data.metadata,
      } as BillFocusedData;
    }

    if (minCompanyCount > 1) {
      const validBills = data.nodes.filter(
        (n) => n.type === "bill" && (n.companyCount || 0) >= minCompanyCount,
      );
      const validBillIds = new Set(validBills.map((n) => n.id));

      const validEdges = data.edges.filter((e) => {
        const targetId =
          typeof e.target === "object" ? (e.target as any).id : e.target;
        return validBillIds.has(targetId);
      });

      const connectedCompanyIds = new Set(
        validEdges.map((e) =>
          typeof e.source === "object" ? (e.source as any).id : e.source,
        ),
      );
      const validCompanies = data.nodes.filter(
        (n) => n.type === "company" && connectedCompanyIds.has(n.id),
      );

      workingData = {
        ...data,
        nodes: [...validBills, ...validCompanies],
        edges: validEdges,
      };
    }

    // Filter out fringe companies in default view to reduce clutter
    if (noFilters && !selectedCompany && viewMode === "default") {
      const significantCompanies = workingData.nodes.filter((n) => {
        if (n.type !== "company") return true;
        const expenditure = n.totalExpenditure || n.expenditure || 0;
        return expenditure >= fringeCompanyThreshold;
      });

      const significantCompanyIds = new Set(
        significantCompanies.map((n) => n.id),
      );
      const significantEdges = workingData.edges.filter((e) => {
        const sourceId =
          typeof e.source === "object" && e.source
            ? (e.source as any).id
            : e.source;
        const targetId =
          typeof e.target === "object" && e.target
            ? (e.target as any).id
            : e.target;
        return (
          sourceId &&
          targetId &&
          significantCompanyIds.has(sourceId) &&
          significantCompanyIds.has(targetId)
        );
      });

      workingData = {
        ...workingData,
        nodes: significantCompanies,
        edges: significantEdges,
      };
    }

    if (noFilters && !selectedCompany) {
      if (showOnlyTopNodes) {
        return getTopNodesData(workingData, dollarLimit);
      } else {
        return workingData;
      }
    }

    // Handle sector filtering only (no search query)
    const matchesSector = (sector: string) =>
      isAllSectors || sector === selectedSector;
    const toId = (v: any) => (typeof v === "object" ? v.id : v);

    let filteredEdges: any[];
    if (selectedCompany) {
      filteredEdges = data.edges
        .filter((e: any) => String(e.company) === selectedCompany)
        .map((e: any) => ({
          ...e,
          source: toId(e.source),
          target: toId(e.target),
        }));
    } else {
      filteredEdges = data.edges
        .filter((e: any) => matchesSector(e.sector))
        .map((e: any) => ({
          ...e,
          source: toId(e.source),
          target: toId(e.target),
        }));
    }

    const nodeIdSet = new Set<string>();
    filteredEdges.forEach((e: any) => {
      if (e.source) nodeIdSet.add(String(e.source));
      if (e.target) nodeIdSet.add(String(e.target));
    });

    const filteredNodes = data.nodes.filter((n: any) =>
      nodeIdSet.has(String(n.id)),
    );

    const result = {
      nodes: filteredNodes,
      edges: filteredEdges,
      bills: data.bills,
      metadata: data.metadata,
    } as BillFocusedData;

    if (showOnlyTopNodes) {
      return getTopNodesData(result, dollarLimit);
    }

    return result;
  }, [
    data,
    selectedSector,
    companyQuery,
    selectedCompany,
    dollarLimit,
    showOnlyTopNodes,
    getTopNodesData,
    isIsolationMode,
    selectedBill,
    minCompanyCount,
    fringeCompanyThreshold,
    viewMode,
    selectedCompanyNode,
  ]);

  useEffect(() => {
    if (!selectedCompany) return;
    const normQuery = companyQuery.trim().toLowerCase();
    const normSelected = selectedCompany.trim().toLowerCase();
    if (normQuery !== normSelected) {
      setSelectedCompany(null);
    }
  }, [companyQuery, selectedCompany]);

  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const normalizeBillNumber = (input: string | undefined) => {
      if (!input) return undefined;
      const upper = String(input).toUpperCase();
      const match = upper.match(/([A-Z]{1,3})[\-\s]?(\d{1,5})/);
      if (!match) return upper;
      return `${match[1]}-${match[2]}`;
    };

    const parseKeyTakeaways = (value: any): string[] => {
      if (!value) {
        return [];
      }
      if (Array.isArray(value)) {
        return value.filter(Boolean);
      }
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) return parsed.filter(Boolean);
        } catch (e) { }
        const split = value
          .split(/\n|\r|\u2022|\-|;|\•/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        return split;
      }
      return [];
    };

    const loadData = async () => {
      try {
        const [networkRes, billsRes] = await Promise.all([
          fetch("/api/network-data"),
          fetch("/api/bill-data").catch((error) => {
            console.error("Failed to fetch bill-data:", error);
            return null;
          }),
        ]);
        if (!networkRes.ok) throw new Error("Failed to load network data");
        const networkData = await networkRes.json();

        let billMap: Map<string, any> | null = null;
        if (billsRes && billsRes.ok) {
          const billsPayload = await billsRes.json();
          const bills = Array.isArray(billsPayload?.bills)
            ? billsPayload.bills
            : [];
          billMap = new Map<string, any>();
          bills.forEach((b: any) => {
            const key = normalizeBillNumber(b.bill_number);
            if (key) {
              billMap!.set(key, {
                ...b,
                id: b.bill_id,
                billNumber: b.bill_number,
                title: b.bill_title,
                policyCategory: b.policy_area,
                keyTakeaways: b.key_takeaways,
              });
            }
          });
        } else {
        }

        const enriched = { ...networkData };
        enriched.nodes = networkData.nodes.map((n: any) => {
          if (n.type !== "bill") return n;
          const normalized = normalizeBillNumber(n.billNumber || n.label);
          const dbBill = billMap ? billMap.get(normalized!) : null;

          const policyCategory =
            dbBill?.policyCategory ||
            n.policyCategory ||
            (n as any).policyArea ||
            "Uncategorized";
          const rawKeyTakeaways =
            dbBill?.keyTakeaways ?? dbBill?.key_takeaways ?? n.keyTakeaways;
          const keyTakeaways = parseKeyTakeaways(rawKeyTakeaways);
          const enrichedNode = {
            ...n,
            billNumber: normalized || n.billNumber,
            policyCategory,
            keyTakeaways,
            title: dbBill?.title || n.title || n.label,
            imageUrl: dbBill?.imageUrl ?? n.imageUrl ?? null,
            summary: dbBill?.summary || n.summary,
            billId: dbBill?.id ?? n.billId,
          };
          return enrichedNode;
        });

        setData(enriched);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const { sectors, maxCompanyCount } = useMemo(() => {
    if (!data) return { sectors: [], maxCompanyCount: 1 };

    const companyNodes = data.nodes.filter((n: any) => n.type === "company");
    const billNodes = data.nodes.filter((n: any) => n.type === "bill");

    const sectors = Array.from(
      new Set(companyNodes.map((c: any) => c.sector).filter(Boolean)),
    ).sort();

    const maxCount = Math.max(
      ...billNodes.map((b: any) => b.companyCount || 0),
      1,
    );

    return { sectors, maxCompanyCount: maxCount };
  }, [data]);

  const maxExpenditure = useMemo(() => {
    if (!data) return 50000000;
    const companyNodes = data.nodes.filter((n: any) => n.type === "company");
    const billNodes = data.nodes.filter((n: any) => n.type === "bill");

    const maxCompanyExp = Math.max(
      ...companyNodes.map((c: any) => c.totalExpenditure || c.expenditure || 0),
      0,
    );
    const maxBillExp = Math.max(
      ...billNodes.map((b: any) => b.totalExpenditure || 0),
      0,
    );

    return Math.max(maxCompanyExp, maxBillExp);
  }, [data]);

  useEffect(() => {
    if (data && maxExpenditure > 0 && showOnlyTopNodes) {
      const suggestedLimit = Math.max(100000, maxExpenditure * 0.1);
      if (dollarLimit === 1000000) {
        setDollarLimit(suggestedLimit);
      }
    }

    // Set intelligent default for fringe company threshold
    if (data && maxExpenditure > 0 && fringeCompanyThreshold === 500000) {
      const suggestedFringeThreshold = Math.max(100000, maxExpenditure * 0.05);
      setFringeCompanyThreshold(suggestedFringeThreshold);
    }
  }, [
    data,
    maxExpenditure,
    dollarLimit,
    showOnlyTopNodes,
    fringeCompanyThreshold,
  ]);

  useEffect(() => {
    if (!selectedCompany) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target.closest(".node") || target.closest(".filterOverlay")) return;
      setSelectedCompany(null);
      setCompanyQuery("");
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [selectedCompany]);

  const handleBillClick = (bill: Node) => {
    if (displayData) {
      displayData.nodes.forEach((n: any) => {
        n.fx = null;
        n.fy = null;
      });
    }

    setSelectedBill(bill);
    setSelectedCompanyNode(null);
    setIsIsolationMode(true);
    setViewMode("bill-focus");
  };

  const handleCompanyClick = (company: Node) => {
    if (displayData) {
      displayData.nodes.forEach((n: any) => {
        n.fx = null;
        n.fy = null;
      });
    }

    setSelectedCompanyNode(company);
    setSelectedBill(null);
    setIsIsolationMode(false);
    setViewMode("company-focus");
  };

  const handleExitIsolation = () => {
    setIsIsolationMode(false);
    setSelectedBill(null);
    setSelectedCompanyNode(null);
    setViewMode("default");

    if (displayData) {
      displayData.nodes.forEach((n: any) => {
        n.fx = null;
        n.fy = null;
      });
    }
  };

  const handleClearCompanySelection = () => {
    setSelectedCompanyNode(null);
    setViewMode("default");

    if (displayData) {
      displayData.nodes.forEach((n: any) => {
        n.fx = null;
        n.fy = null;
      });
    }
  };

  const filterOverlayProps = {
    companyQuery,
    onCompanyQueryChange: setCompanyQuery,
    dollarLimit,
    onDollarLimitChange: setDollarLimit,
    showOnlyTopNodes,
    onShowOnlyTopNodesChange: setShowOnlyTopNodes,
    totalNodes: data?.nodes.length,
    displayedNodes: displayData?.nodes.length,
    maxExpenditure,
    minCompanyCount,
    onMinCompanyCountChange: setMinCompanyCount,
    maxCompanyCount,
    fringeCompanyThreshold,
    onFringeCompanyThresholdChange: setFringeCompanyThreshold,
  };

  if (loading) {
    return <DashboardLoadingState />;
  }
  if (error) {
    return (
      <div className={styles.fullscreen}>
        <div className={styles.loading}>
          <div className={styles.loadingCard}>
            <h2 className={styles.errorTitle}>Failed to Load Dashboard</h2>
            <p className={styles.errorDescription}>
              Unable to load California Lobbyist Employer lobbying expenditures
              data. Please try refreshing the page or contact support if the
              issue persists.
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div ref={containerRef} className={styles.fullscreen}>
      <div className="filterOverlay">
        {viewMode === "bill-focus" && selectedBill ? (
          <BillDetailsOverlay
            bill={selectedBill}
            connectedCompanies={
              displayData?.nodes.filter((n) => n.type === "company") || []
            }
            onClose={handleExitIsolation}
            onViewOnVeeto={() => {
              if (selectedBill.billId) {
                const url = `https://veeto.app/bill/${selectedBill.billId}`;
                window.open(url, "_blank");
              }
            }}
          />
        ) : viewMode === "company-focus" && selectedCompanyNode ? (
          <CompanyDetailsOverlay
            company={selectedCompanyNode}
            connectedBills={
              displayData
                ? (displayData.edges
                  .filter((e): e is Link => {
                    if (!e.source) return false;
                    const sourceId =
                      typeof e.source === "object"
                        ? (e.source as Node).id
                        : e.source;
                    return sourceId === selectedCompanyNode.id;
                  })
                  .map((e) => {
                    if (!e.target) return null;
                    const targetId =
                      typeof e.target === "object"
                        ? (e.target as Node).id
                        : e.target;
                    return displayData.nodes.find((n) => n.id === targetId);
                  })
                  .filter(Boolean) as Node[])
                : []
            }
            onClose={handleClearCompanySelection}
          />
        ) : (
          <FilterOverlay {...filterOverlayProps} />
        )}
      </div>
      {viewMode === "bill-focus" ? (
        <BillFocusView
          key={`bill-${selectedBill?.id}-${displayData?.nodes.length}`}
          data={displayData}
          selectedBill={selectedBill}
          isIsolationMode={isIsolationMode}
          onBillClick={handleBillClick}
          onCompanyClick={handleCompanyClick}
          onExitIsolation={handleExitIsolation}
          onClearCompanySelection={handleClearCompanySelection}
          containerRef={containerRef}
        />
      ) : viewMode === "company-focus" ? (
        <CompanyFocusView
          key={`company-${selectedCompanyNode?.id}-${displayData?.nodes.length}`}
          data={displayData}
          selectedCompanyNode={selectedCompanyNode}
          onCompanyClick={handleCompanyClick}
          onBillClick={handleBillClick}
          onExitCompanyFocus={handleClearCompanySelection}
          containerRef={containerRef}
        />
      ) : (
        <DefaultView
          key={`default-${displayData?.nodes.length}-${fringeCompanyThreshold}`}
          data={displayData}
          onBillClick={handleBillClick}
          onCompanyClick={handleCompanyClick}
          containerRef={containerRef}
          isFiltered={fringeCompanyThreshold > 0 && viewMode === "default"}
        />
      )}
    </div>
  );
}

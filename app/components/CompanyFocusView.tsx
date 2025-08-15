"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { useTooltip } from "./Tooltip";

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

interface CompanyFocusViewProps {
  data: BillFocusedData;
  selectedCompanyNode: Node | null;
  onCompanyClick: (company: Node) => void;
  onBillClick: (bill: Node) => void;
  onExitCompanyFocus: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export default function CompanyFocusView({
  data,
  selectedCompanyNode,
  onCompanyClick,
  onBillClick,
  onExitCompanyFocus,
  containerRef,
}: CompanyFocusViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { showTooltip, moveTooltip, hideTooltip } = useTooltip({
    containerRef,
    className: "company-focus-tooltip",
  });

  useEffect(() => {
    if (
      !data ||
      !svgRef.current ||
      !containerRef.current ||
      !selectedCompanyNode
    )
      return;

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);

    svg.selectAll("*").remove();

    const width = container.clientWidth;
    const height = container.clientHeight || window.innerHeight;

    svg.attr("width", width).attr("height", height);

    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 10])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any).on("click", function (event) {
      if (event.target === this) {
        onExitCompanyFocus();
      }
    });

    const g = svg.append("g");

    const companyNode = selectedCompanyNode;
    const connectedEdges = data.edges.filter((e: any) => {
      const sourceId = typeof e.source === "object" ? e.source.id : e.source;
      return sourceId === selectedCompanyNode.id;
    });
    const connectedBillIds = new Set(
      connectedEdges.map((e: any) =>
        typeof e.target === "object" ? e.target.id : e.target,
      ),
    );
    const connectedBills = data.nodes.filter(
      (n: any) => n.type === "bill" && connectedBillIds.has(n.id),
    );

    const focusedNodes = [companyNode, ...connectedBills];
    const focusedEdges = connectedEdges;

    const companyRadius = 40;
    const billRadiusScale = d3
      .scaleSqrt()
      .domain([1, d3.max(connectedBills, (d: any) => d.companyCount || 1) || 1])
      .range([16, 32]);

    function nodeRadius(d: any) {
      if (d.type === "company") return companyRadius;
      if (d.type === "bill") return billRadiusScale(d.companyCount || 1);
      return 12;
    }

    focusedNodes.forEach((n: any, i: number) => {
      n.size = nodeRadius(n);

      if (n.type === "company" && n.id === selectedCompanyNode.id) {
        n.x = width / 2;
        n.y = height / 2;
        n.fx = width / 2;
        n.fy = height / 2;
      } else if (n.type === "bill") {
        const angle = (i * 2 * Math.PI) / connectedBills.length;
        const radius = Math.min(width, height) * 0.6;
        n.x = width / 2 + Math.cos(angle) * radius;
        n.y = height / 2 + Math.sin(angle) * radius;
      }
    });

    const simulation = d3
      .forceSimulation(focusedNodes)
      .alpha(0.3)
      .alphaDecay(0.01)
      .velocityDecay(0.4)
      .force(
        "link",
        d3
          .forceLink(focusedEdges)
          .id((d: any) => d.id)
          .distance(150)
          .strength(0.2),
      )
      .force(
        "charge",
        d3.forceManyBody().strength(-500).distanceMax(400).theta(0.8),
      )
      .force(
        "collision",
        d3
          .forceCollide()
          .radius((d: any) => nodeRadius(d) + 8)
          .strength(0.7)
          .iterations(2),
      );

    const edges = g
      .append("g")
      .attr("class", "edges")
      .selectAll("line")
      .data(focusedEdges)
      .enter()
      .append("line")
      .attr("stroke", "#d1d5db")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2);

    const nodes = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(focusedNodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(
        d3
          .drag<any, any>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended),
      );

    nodes
      .append("circle")
      .attr("r", (d: any) => nodeRadius(d))
      .attr("fill", (d: any) => {
        switch (d.type) {
          case "company":
            return "#9ca3af";
          case "bill":
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
              const raw = String(d.policyCategory || "").toLowerCase();
              if (raw.includes("health")) return "Health";
              return d.policyCategory as string;
            })();
            return policyColors[resolvedKey] || "#8f7d75";
          default:
            return "#6b7280";
        }
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("opacity", 0.9)
      .on("click", function (event, d: any) {
        event.stopPropagation();
        hideTooltip();
        if (d.type === "company") {
          onCompanyClick(d);
        } else if (d.type === "bill") {
          onBillClick(d);
        }
      })
      .on("mouseover", function (event, d: any) {
        showTooltip(event, d);
      })
      .on("mousemove", function (event) {
        moveTooltip(event);
      })
      .on("mouseout", function () {
        hideTooltip();
      });

    nodes
      .append("text")
      .text((d: any) => {
        if (d.type === "company") {
          const name = d.label || "";
          return name.length > 15 ? name.substring(0, 13) + "..." : name;
        }
        const billNum = d.billNumber || d.label;
        const match = billNum.match(/([A-Z]{1,3}[\\-\\s]?\\d{1,5})/);
        return match ? match[1] : billNum.split(" ")[0];
      })
      .attr("text-anchor", "middle")
      .attr("dy", (d: any) => {
        if (d.type === "company") return d.size + 20;
        return d.size + 14;
      })
      .attr("font-size", (d: any) => {
        if (d.type === "company") return "14px";
        return "10px";
      })
      .attr("fill", (d: any) => {
        if (d.type === "company") return "#1f2937";
        return "#374151";
      })
      .attr("font-weight", (d: any) => (d.type === "company" ? "700" : "500"))
      .attr("pointer-events", "none")
      .style("text-shadow", "0 1px 4px rgba(255,255,255,0.95)");

    simulation.on("tick", () => {
      edges
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodes.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.01);
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.001);
      if (selectedCompanyNode && d.id === selectedCompanyNode.id) {
        d.fx = width / 2;
        d.fy = height / 2;
      } else {
        setTimeout(() => {
          d.fx = null;
          d.fy = null;
        }, 100);
      }
    }

    return () => {
      simulation.stop();
    };
  }, [data, selectedCompanyNode, onCompanyClick, onBillClick]);

  return <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />;
}

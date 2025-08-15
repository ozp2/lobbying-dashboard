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

interface DefaultViewProps {
  data: BillFocusedData;
  onBillClick: (bill: Node) => void;
  onCompanyClick: (company: Node) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  isFiltered?: boolean;
}

export default function DefaultView({
  data,
  onBillClick,
  onCompanyClick,
  containerRef,
  isFiltered,
}: DefaultViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { showTooltip, moveTooltip, hideTooltip } = useTooltip({
    containerRef,
    className: "default-view-tooltip",
  });

  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;

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

    svg.call(zoom as any);

    const g = svg.append("g");

    const companyNodes = data.nodes.filter((n: any) => n.type === "company");
    const billNodes = data.nodes.filter((n: any) => n.type === "bill");

    const minExp =
      d3.min(
        companyNodes,
        (d: any) => d.totalExpenditure || d.expenditure || 0,
      ) || 0;
    const maxExp =
      d3.max(
        companyNodes,
        (d: any) => d.totalExpenditure || d.expenditure || 1,
      ) || 1;
    const minCompanyCount =
      d3.min(billNodes, (d: any) => d.companyCount || 0) || 0;
    const maxCompanyCount =
      d3.max(billNodes, (d: any) => d.companyCount || 1) || 1;

    const billRadiusScale = d3
      .scaleSqrt()
      .domain([Math.max(1, minCompanyCount), maxCompanyCount])
      .range([12, 30]);

    const companyRadiusScale = d3
      .scaleSqrt()
      .domain([Math.max(1, minExp), maxExp])
      .range([6, 12]);

    function nodeRadius(d: any) {
      if (d.type === "bill") return billRadiusScale(d.companyCount || 1);
      if (d.type === "company")
        return companyRadiusScale(d.totalExpenditure || d.expenditure || 0);
      return 8;
    }

    data.nodes.forEach((n: any, i: number) => {
      n.size = nodeRadius(n);

      if (!n.x && !n.y) {
        const gridSize = Math.ceil(Math.sqrt(data.nodes.length));
        const cellSize = (Math.max(width, height) * 1.2) / gridSize;
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        const centerX = width / 2;
        const centerY = height / 2;
        n.x =
          centerX +
          (col - gridSize / 2 + 0.5) * cellSize +
          (Math.random() - 0.5) * 150;
        n.y =
          centerY +
          (row - gridSize / 2 + 0.5) * cellSize +
          (Math.random() - 0.5) * 150;
      }
    });

    const simulation = d3
      .forceSimulation(data.nodes)
      .alpha(0.15)
      .alphaDecay(0.02)
      .velocityDecay(0.6)
      .force(
        "link",
        d3
          .forceLink(data.edges)
          .id((d: any) => d.id)
          .distance(150)
          .strength(0.08),
      )
      .force(
        "charge",
        d3.forceManyBody().strength(-600).distanceMax(400).theta(0.9),
      )
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.08))
      .force(
        "collision",
        d3
          .forceCollide()
          .radius((d: any) => nodeRadius(d) + 12)
          .strength(0.8)
          .iterations(2),
      );

    const edges = g
      .append("g")
      .attr("class", "edges")
      .selectAll("line")
      .data(data.edges)
      .enter()
      .append("line")
      .attr("stroke", "#d1d5db")
      .attr("stroke-opacity", 0.3)
      .attr("stroke-width", 1);

    const nodes = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(data.nodes)
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
          case "company":
            return "#9ca3af";
          default:
            return "#6b7280";
        }
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.9)
      .on("click", function (event, d: any) {
        event.stopPropagation();
        hideTooltip();
        if (d.type === "bill") {
          onBillClick(d);
        } else if (d.type === "company") {
          onCompanyClick(d);
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
        if (d.type === "bill") {
          const billNum = d.billNumber || d.label;
          const match = billNum.match(/([A-Z]{1,3}[\\-\\s]?\\d{1,5})/);
          return match ? match[1] : billNum.split(" ")[0];
        }
        const name = d.label || "";
        return name.length > 16 ? name.substring(0, 14) + "..." : name;
      })
      .attr("text-anchor", "middle")
      .attr("dy", (d: any) => {
        if (d.type === "bill") return d.size + 18;
        return d.size + 12;
      })
      .attr("font-size", (d: any) => {
        if (d.type === "bill") return "12px";
        return "8px";
      })
      .attr("fill", (d: any) => {
        if (d.type === "bill") return "#111827";
        return "#9ca3af";
      })
      .attr("font-weight", (d: any) => (d.type === "bill" ? "600" : "400"))
      .attr("pointer-events", "none")
      .style("text-shadow", "0 1px 3px rgba(255,255,255,0.9)")
      .attr("font-family", "var(--standard-font-family)")
      .each(function (d: any) {
        if (d.type === "company") {
          const text = d3.select(this);
          const name = d.label || "";

          if (name.length > 16) {
            // Split long names into maximum 2 lines
            const words = name.split(' ');
            const lines = [];
            let currentLine = '';

            for (const word of words) {
              if ((currentLine + word).length <= 14) {
                currentLine += (currentLine ? ' ' : '') + word;
              } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
              }
            }
            if (currentLine) lines.push(currentLine);

            // Limit to maximum 2 lines
            if (lines.length > 2) {
              lines[1] = lines[1].substring(0, 11) + "...";
              lines.splice(2);
            }

            // Remove existing text and add multi-line text
            text.text(null);
            lines.forEach((line, i) => {
              text.append("tspan")
                .text(line)
                .attr("x", 0)
                .attr("dy", i === 0 ? "0" : "1.2em")
                .attr("text-anchor", "middle");
            });
          }
        }
      });

    simulation.on("tick", () => {
      edges
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodes.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.03);
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.001);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data, onBillClick, onCompanyClick, isFiltered]);

  return (
    <svg ref={svgRef} style={{ width: "100%", height: "100%" }}>
      {isFiltered && (
        <g className="filter-indicator">
          <rect
            x="20"
            y="20"
            width="320"
            height="45"
            fill="rgba(0,0,0,0.8)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
            rx="8"
          />
          <text
            x="35"
            y="45"
            fill="white"
            fontSize="13"
            fontFamily="var(--standard-font-family)"
            fontWeight="500"
          >
            💡 Small companies hidden for clarity. Click a bill to see all.
          </text>
        </g>
      )}
    </svg>
  );
}

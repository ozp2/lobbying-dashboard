"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import styles from "./Tooltip.module.css";

interface Node {
    id: string;
    label: string;
    type: "bill" | "company";
    billNumber?: string;
    title?: string;
    policyCategory?: string;
    companyCount?: number;
    totalExpenditure?: number;
    sector?: string;
    subcategory?: string;
    expenditure?: number;
}

interface TooltipProps {
    containerRef: React.RefObject<HTMLDivElement>;
    className: string;
}

export function useTooltip({ containerRef, className }: TooltipProps) {
    const tooltipRef = useRef<any>(null);

    useEffect(() => {
        if (tooltipRef.current) {
            tooltipRef.current.remove();
            tooltipRef.current = null;
        }

        d3.selectAll(`.${className}`).remove();

        const tooltip = d3
            .select("body")
            .append("div")
            .attr("class", `${className} ${styles.tooltip}`);

        tooltipRef.current = tooltip;

        return () => {
            if (tooltipRef.current) {
                tooltipRef.current.remove();
                tooltipRef.current = null;
            }
        };
    }, [className]);

    const showTooltip = (event: any, node: Node) => {
        if (!tooltipRef.current) return;

        let content = "";
        if (node.type === "bill") {
            const billNum = node.billNumber || node.label;
            const title = node.title || node.label;
            const policyArea = node.policyCategory || "Uncategorized";
            const companyCount = node.companyCount || 0;
            const expenditure = node.totalExpenditure || 0;

            content = `
                <div class="${styles.tooltipTitle}">${billNum}</div>
                <div class="${styles.tooltipSubtitle}">${title}</div>
                <div class="${styles.tooltipDetail}">Policy Area: ${policyArea}</div>
                <div class="${styles.tooltipDetail}">Companies: ${companyCount}</div>
                ${expenditure > 0 ? `<div class="${styles.tooltipDetailLast}">Total Expenditure: $${expenditure.toLocaleString()}</div>` : ""}
            `;
        } else if (node.type === "company") {
            const name = node.label || "Unknown Company";
            const sector = node.sector || "Unknown Sector";
            const subcategory = node.subcategory;
            const expenditure = node.totalExpenditure || node.expenditure || 0;

            content = `
                <div class="${styles.tooltipTitle}">${name}</div>
                <div class="${styles.tooltipDetail}">Sector: ${sector}</div>
                ${subcategory ? `<div class="${styles.tooltipDetail}">Subcategory: ${subcategory}</div>` : ""}
                <div class="${styles.tooltipDetailLast}">Total lobbying expenditures: $${expenditure.toLocaleString()}</div>
            `;
        }

        tooltipRef.current
            .html(content)
            .style("visibility", "visible")
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 10 + "px");
    };

    const moveTooltip = (event: any) => {
        if (!tooltipRef.current) return;

        tooltipRef.current
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 10 + "px");
    };

    const hideTooltip = () => {
        if (!tooltipRef.current) return;

        tooltipRef.current
            .style("visibility", "hidden")
            .style("left", "-9999px")
            .style("top", "-9999px");
    };

    return {
        showTooltip,
        moveTooltip,
        hideTooltip,
    };
}

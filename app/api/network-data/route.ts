import { NextResponse } from "next/server";

import { Pool } from "pg";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const minExpenditure = parseFloat(searchParams.get("minExpenditure") || "0");
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "5432"),
    max: parseInt(process.env.DB_MAX_CLIENTS || "20"),
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
  });

  try {
    const [companiesResult, connectionsResult, billsResult] = await Promise.all(
      [
        pool.query("SELECT * FROM lobbying.companies ORDER BY id"),
        pool.query("SELECT * FROM lobbying.connections ORDER BY company_name"),
        pool.query(
          "SELECT bill_id, bill_number, bill_title, policy_area FROM api.mv_bills ORDER BY bill_number",
        ),
      ],
    );

    if (companiesResult.rows.length === 0) {
      return NextResponse.json(
        {
          error:
            "No company data found in Supabase. Please run the data population script.",
        },
        { status: 404 },
      );
    }

    if (connectionsResult.rows.length === 0) {
      return NextResponse.json(
        {
          error:
            "No connection data found in Supabase. Please run the data population script.",
        },
        { status: 404 },
      );
    }

    const filteredCompanies = companiesResult.rows.filter(
      (c) => parseFloat(c.total_expenditure || "0") >= minExpenditure,
    );

    const companies = filteredCompanies.map((c, index) => ({
      id: `company-${index}`,
      label: c.company_name,
      type: "company",
      size: Math.max(
        6,
        Math.min(
          28,
          (Math.log(parseFloat(c.total_expenditure) || 1000) /
            Math.log(100000)) *
            20,
        ),
      ),
      totalExpenditure: parseFloat(c.total_expenditure || 0),
      expenditure: parseFloat(c.total_expenditure || 0),
      sector: c.sector,
      subcategory: c.subcategory,
    }));

    const companyNameToIndex = new Map();
    filteredCompanies.forEach((c, index) => {
      companyNameToIndex.set(c.company_name, index);
    });

    const billStats = new Map();
    connectionsResult.rows.forEach((conn) => {
      const billNumber = conn.bill_number;
      if (!billStats.has(billNumber)) {
        billStats.set(billNumber, {
          companies: new Set(),
          totalExpenditure: 0,
          connections: [],
        });
      }
      const stats = billStats.get(billNumber);
      stats.companies.add(conn.company_name);
      stats.totalExpenditure += parseFloat(conn.expenditure || 0);
      stats.connections.push(conn);
    });

    const bills = Array.from(billStats.entries()).map(
      ([billNumber, stats], index) => {
        const billInfo = billsResult.rows.find(
          (b) => b.bill_number === billNumber,
        );
        const companyCount = stats.companies.size;

        return {
          id: `bill-${index}`,
          label: billNumber,
          type: "bill",
          size: Math.max(
            8,
            Math.min(
              36,
              companyCount * 0.5 +
                (Math.log(stats.totalExpenditure || 1) / Math.log(10000)) * 5 +
                8,
            ),
          ),
          billNumber: billNumber,
          billId: billInfo?.bill_id || null,
          title: billInfo?.bill_title || `Bill ${billNumber}`,
          policyCategory: billInfo?.policy_area || "Uncategorized",
          companyCount: companyCount,
          totalExpenditure: stats.totalExpenditure,
        };
      },
    );

    const billNumberToIndex = new Map();
    Array.from(billStats.keys()).forEach((billNumber, index) => {
      billNumberToIndex.set(billNumber, index);
    });

    const edges = [];
    connectionsResult.rows.forEach((conn) => {
      const companyIndex = companyNameToIndex.get(conn.company_name);
      const billIndex = billNumberToIndex.get(conn.bill_number);

      if (companyIndex !== undefined && billIndex !== undefined) {
        edges.push({
          source: `company-${companyIndex}`,
          target: `bill-${billIndex}`,
          value: parseFloat(conn.expenditure || 0),
          type: "company-bill",
          sector: conn.sector,
          subcategory: conn.subcategory,
          company: conn.company_name,
          bill: conn.bill_number,
          expenditure: parseFloat(conn.expenditure || 0),
        });
      }
    });

    const result = {
      nodes: [...companies, ...bills],
      edges: edges,
      metadata: {
        totalBills: bills.length,
        totalCompanies: companies.length,
        totalConnections: edges.length,
        totalExpenditure: companies.reduce(
          (sum, c) => sum + c.totalExpenditure,
          0,
        ),
        policyCategories: Array.from(
          new Set(bills.map((b) => b.policyCategory).filter(Boolean)),
        ),
        sectors: Array.from(
          new Set(companies.map((c) => c.sector).filter(Boolean)),
        ),
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error loading data from Supabase:", error);
    return NextResponse.json(
      {
        error: "Failed to load data from Supabase",
        details:
          error instanceof Error ? error.message : "Unknown database error",
        suggestion:
          "Please check your database connection and ensure data has been populated.",
      },
      { status: 500 },
    );
  } finally {
    await pool.end();
  }
}

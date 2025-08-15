import { NextResponse } from "next/server";
import { Pool } from "pg";

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

export async function GET() {
  try {
    try {
      const query = `
                SELECT 
                    bill_id,
                    bill_number,
                    bill_title,
                    policy_area,
                    key_takeaways,
                    summary,
                    image_url
                FROM api.mv_bills
                ORDER BY bill_number
            `;

      const result = await pool.query(query);
      const bills = result.rows;
      const error = null;

      if (error) {
        console.error("Error fetching bill data:", error);
        return NextResponse.json(
          {
            error: "Failed to fetch bill data from database",
            details: error.message,
          },
          { status: 500 },
        );
      }

      return NextResponse.json({ bills: bills || [] });
    } catch (dbError) {
      console.error("Database query failed:", dbError);
      return NextResponse.json(
        {
          error: "Database query failed",
          details:
            dbError instanceof Error
              ? dbError.message
              : "Unknown database error",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in bill-data API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { pool } from "../../lib/db";
import { requestQueue } from "../../lib/requestQueue";

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

      const result = await requestQueue.add(async () => {
        return await pool.query(query);
      });
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

      const response = NextResponse.json({ bills: bills || [] });

      response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
      response.headers.set('Vary', 'Accept-Encoding');

      return response;
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

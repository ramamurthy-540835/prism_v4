import { NextResponse } from "next/server";
import { env } from "@backend/lib/env";
import { queryBigQuery } from "@backend/lib/bigquery";
export async function GET(){ try { const rows = await queryBigQuery(`SELECT * FROM \`${env.projectId}.${env.dataset}.prism_subscriptions\` ORDER BY updated_at DESC`); return NextResponse.json(rows);} catch(error:any){ return NextResponse.json({error:{code:"SUBSCRIPTIONS_FETCH_FAILED",message:String(error?.message??error)}},{status:500}); }}
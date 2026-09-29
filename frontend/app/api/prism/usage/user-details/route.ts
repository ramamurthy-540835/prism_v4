import { NextResponse } from "next/server";
import { env } from "@backend/lib/env";
import { queryBigQuery } from "@backend/lib/bigquery";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const rows = await queryBigQuery(
      userId
        ? `
          SELECT createdAt, userId, role, persona, taskType, provider, modelId, decision, status,
                 estimatedCostUsd, actualCostUsd, totalTokens, inputTokens, outputTokens,
                 latencyMs, promptId, promptVersion, errorCode, errorMessage
          FROM \`${env.projectId}.${env.dataset}.${env.usageTable}\`
          WHERE userId = @userId
          ORDER BY createdAt DESC
          LIMIT 50
        `
        : `
          SELECT createdAt, userId, role, persona, taskType, provider, modelId, decision, status,
                 estimatedCostUsd, actualCostUsd, totalTokens, inputTokens, outputTokens,
                 latencyMs, promptId, promptVersion, errorCode, errorMessage
          FROM \`${env.projectId}.${env.dataset}.${env.usageTable}\`
          ORDER BY createdAt DESC
          LIMIT 100
        `,
      userId ? { userId } : {}
    );

    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: { code: "USER_DETAILS_FAILED", message: String(error?.message ?? error) } }, { status: 500 });
  }
}

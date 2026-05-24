import { predictMatch as predictMatchLocal } from "./predictor";
import type {
  MatchPredictionInputs,
  MatchPredictionResult,
} from "./predictor";

/**
 * Routes the match-prediction call to the FastAPI ML service when
 * `NEXT_PUBLIC_ML_API_URL` is configured, otherwise falls back to the
 * local seeded stub in `predictor.ts`.
 *
 * The fallback keeps the GitHub Pages demo working without any external
 * services. The Lehmer-RNG recipe is shared between the front-end stub
 * and the FastAPI stub (`ml-service/app/predictors/match_stub.py`), so
 * the same input yields the same output regardless of which side runs.
 *
 * `NEXT_PUBLIC_ML_API_TOKEN` is optional. The static-export build can't
 * keep secrets in the browser, so this is a low-stakes token at best —
 * the real protection is CORS allow-listing on the service.
 */
export async function predictMatchAuto(
  inputs: MatchPredictionInputs,
): Promise<MatchPredictionResult> {
  const baseUrl = process.env.NEXT_PUBLIC_ML_API_URL;
  if (!baseUrl) {
    return predictMatchLocal(inputs);
  }

  const url = baseUrl.replace(/\/+$/, "") + "/predict-match";
  const token = process.env.NEXT_PUBLIC_ML_API_TOKEN;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      homeId: inputs.home.id,
      awayId: inputs.away.id,
      competitionId: inputs.competitionId ?? inputs.home.leagueId,
      homeShortName: inputs.home.shortName,
      awayShortName: inputs.away.shortName,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `ML service responded ${res.status} ${res.statusText}. Falling back is the caller's choice.`,
    );
  }

  return (await res.json()) as MatchPredictionResult;
}

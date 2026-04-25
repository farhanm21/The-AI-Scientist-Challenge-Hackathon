import { useState, useCallback } from "react";
import type {  LitQCResult, ExperimentPlan, FeedbackPayload } from "../utils/api";
import {api} from "../utils/api"
// ─── Generic async hook ───────────────────────────────────────────────────────

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const run = useCallback(async (promise: Promise<T>) => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await promise;
      setState({ data, loading: false, error: null });
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setState({ data: null, loading: false, error: msg });
      return null;
    }
  }, []);

  const reset = useCallback(() => setState({ data: null, loading: false, error: null }), []);

  return { ...state, run, reset };
}

// ─── Domain hooks ─────────────────────────────────────────────────────────────

export function useLiteratureQC() {
  const { data, loading, error, run, reset } = useAsync<LitQCResult>();

  const check = useCallback(
    (hypothesis: string) => run(api.literatureQC(hypothesis)),
    [run]
  );

  return { result: data, loading, error, check, reset };
}

export function useExperimentPlan() {
  const { data, loading, error, run, reset } = useAsync<ExperimentPlan>();

  const generate = useCallback(
    (hypothesis: string) => run(api.experimentPlan(hypothesis)),
    [run]
  );

  return { plan: data, loading, error, generate, reset };
}

export function useFeedback() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const submit = useCallback(async (payload: FeedbackPayload) => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await api.saveFeedback(payload);
      setSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }, []);

  return { submit, saving, saved, error };
}

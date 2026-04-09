import { useEffect, useState } from "react";
import { fetchJson } from "./api";

export function useApi(path, initialValue) {
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function run() {
      setLoading(true);
      setError("");
      try {
        const payload = await fetchJson(path);
        if (active) {
          setData(payload);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Something went wrong");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      active = false;
    };
  }, [path]);

  return { data, loading, error };
}

export type ApiData = {
  error?: string;
  added?: number;
  failed?: string[];
  url?: string;
  slides?: { id: number; url: string; alt_text: string | null; active: number | boolean }[];
};
export type ApiResult = { ok: boolean; data: ApiData };

/** Upload with progress (fetch can't report upload progress; XHR can). */
export function uploadWithProgress(
  url: string, form: FormData, onProgress?: (pct: number) => void
): Promise<ApiResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data: ApiData = {};
      try { data = JSON.parse(xhr.responseText); } catch { /* non-JSON error body */ }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, data });
    };
    xhr.onerror = () => resolve({ ok: false, data: { error: "Network error. Check your connection and try again." } });
    xhr.send(form);
  });
}

export async function api(url: string, method: string, body?: unknown): Promise<ApiResult> {
  try {
    const res = await fetch(url, {
      method, headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    return { ok: res.ok, data: (await res.json().catch(() => ({}))) as ApiData };
  } catch {
    return { ok: false, data: { error: "Network error. Check your connection and try again." } };
  }
}

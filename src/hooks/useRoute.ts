import { useEffect, useState } from "react";

export interface Route {
  path: string;
  params: URLSearchParams;
}

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const [path = "", query = ""] = raw.split("?");
  return { path: path.replace(/\/$/, "").toLowerCase(), params: new URLSearchParams(query) };
}

/** Hash-based routing so the app works on GitHub Pages without server rewrites. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parseHash);
  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

export function navigate(target: string): void {
  window.location.hash = `#/${target}`;
}

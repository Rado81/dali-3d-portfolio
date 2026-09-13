import { useEffect, useState } from "react";
import { SRGBColorSpace, Texture, TextureLoader } from "three";
import { thumbnailChain } from "../content/projects";
import { useStore } from "../store";

const STAND_IN_WIDTH = 120;
const sharedLoader = new TextureLoader();
sharedLoader.setCrossOrigin("anonymous");
const cache = new Map<string, Promise<Texture | null>>();

export async function loadThumbnail(urls: string[], loader: TextureLoader = sharedLoader): Promise<Texture | null> {
  for (const url of urls) {
    try {
      const texture = await loader.loadAsync(url);
      const image = texture.image as { width?: number; height?: number } | undefined;
      const width = image?.width ?? 0;
      const height = image?.height ?? 0;
      if (width <= STAND_IN_WIDTH) {
        texture.dispose();
        continue;
      }
      texture.colorSpace = SRGBColorSpace;
      if (height > 0 && width / height < 1.7) {
        texture.repeat.set(1, 0.75);
        texture.offset.set(0, 0.125);
      }
      return texture;
    } catch {
      continue;
    }
  }
  return null;
}

function load(key: string, urls: () => string[]): Promise<Texture | null> {
  let promise = cache.get(key);
  if (!promise) {
    promise = loadThumbnail(urls());
    cache.set(key, promise);
  }
  return promise;
}

/** Full-resolution keys a tile has asked for; once asked, a tile keeps full resolution. */
const fullRequested = new Set<string>();

/**
 * A tile's texture. Far-away tiles and the blurred ring behind the title card get a small preview;
 * `wantFull` upgrades to full resolution, keeping the preview on screen until the sharp image
 * arrives, and the tile never drops back once it has been sharp.
 */
export function useThumbnail(youtubeId: string, wantFull: boolean): Texture | null {
  const isMobile = useStore((s) => s.isMobile);
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    const previewKey = `${youtubeId}:preview`;
    const fullKey = `${youtubeId}:${isMobile ? "m" : "d"}`;
    if (wantFull) fullRequested.add(fullKey);

    let alive = true;
    const show = (t: Texture | null) => {
      if (alive && t) setTexture(t);
    };
    const preview = () => load(previewKey, () => thumbnailChain(youtubeId, isMobile, "preview"));
    if (fullRequested.has(fullKey)) {
      load(fullKey, () => thumbnailChain(youtubeId, isMobile, "full")).then((t) => (t ? show(t) : preview().then(show)));
    } else {
      preview().then(show);
    }
    return () => {
      alive = false;
    };
  }, [youtubeId, isMobile, wantFull]);

  return texture;
}

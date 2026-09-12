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

export function useThumbnail(youtubeId: string): Texture | null {
  const isMobile = useStore((s) => s.isMobile);
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    const key = `${youtubeId}:${isMobile ? "m" : "d"}`;
    let promise = cache.get(key);
    if (!promise) {
      promise = loadThumbnail(thumbnailChain(youtubeId, isMobile));
      cache.set(key, promise);
    }
    let alive = true;
    promise.then((t) => {
      if (alive) setTexture(t);
    });
    return () => {
      alive = false;
    };
  }, [youtubeId, isMobile]);

  return texture;
}

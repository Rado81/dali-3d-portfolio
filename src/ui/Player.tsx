import { useCallback, useRef } from "react";
import { projectByYoutubeId } from "../content/projects";
import { useStore } from "../store";
import { useFocusTrap } from "./useFocusTrap";

export function Player() {
  const id = useStore((s) => s.playingId);
  const stopPlaying = useStore((s) => s.stopPlaying);
  const ref = useRef<HTMLDivElement>(null);
  const onEscape = useCallback(() => stopPlaying(), [stopPlaying]);
  useFocusTrap(ref, id !== null, onEscape);
  if (!id) return null;
  const title = projectByYoutubeId(id)?.title ?? "Video";
  return (
    <div className="player" data-testid="player-scrim" onClick={stopPlaying} ref={ref} role="dialog" aria-modal="true" aria-label={title}>
      <button className="player__close" aria-label="Close video" onClick={stopPlaying}>×</button>
      <div className="player__frame" onClick={(e) => e.stopPropagation()}>
        <iframe
          title={title}
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&color=white`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <a className="player__link label" href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
        Open on YouTube
      </a>
    </div>
  );
}

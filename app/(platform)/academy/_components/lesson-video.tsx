/**
 * Lesson video surface.
 *
 * Renders an AI-instructor video when a lesson provides a HeyGen (or other) video URL.
 * When no URL is set, it shows a graceful "coming soon" placeholder so the lesson still
 * reads well. Actual video generation is a live/ops step handled outside the platform —
 * this component only consumes a URL and does not call any AI provider.
 */
export function LessonVideo({ videoUrl, title }: { videoUrl?: string; title: string }) {
  if (!videoUrl) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-center">
        <div className="px-6">
          <p className="text-sm font-medium text-foreground">AI instructor video coming soon</p>
          <p className="mt-1 text-xs text-muted-foreground">
            The written lesson below covers everything you need for now.
          </p>
        </div>
      </div>
    )
  }

  return (
    <video
      controls
      preload="metadata"
      className="aspect-video w-full rounded-lg border border-border bg-black"
      aria-label={`${title} — instructor video`}
    >
      <source src={videoUrl} />
      Your browser does not support embedded video.
    </video>
  )
}

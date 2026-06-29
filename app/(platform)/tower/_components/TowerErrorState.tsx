interface TowerErrorStateProps {
  title?: string
  message?: string
}

export function TowerErrorState({
  title = 'Failed to load',
  message = 'An error occurred while loading this section. Try refreshing the page.',
}: TowerErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
      <p className="text-sm font-medium text-destructive">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">{message}</p>
    </div>
  )
}

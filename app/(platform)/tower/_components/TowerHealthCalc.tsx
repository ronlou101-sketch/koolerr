interface TowerHealthCalcProps {
  description: string
  rules: string[]
}

export function TowerHealthCalc({ description, rules }: TowerHealthCalcProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Health Calculation
      </p>
      <p className="mt-2 text-sm leading-relaxed text-foreground">{description}</p>
      <ul className="mt-3 space-y-1.5">
        {rules.map((rule, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
            <span className="mt-px flex-shrink-0">·</span>
            <span>{rule}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface ThemedSelectProps {
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
  "aria-label"?: string
  title?: string
  id?: string
  [key: string]: any
}

export function ThemedSelect({
  value,
  onChange,
  children,
  "aria-label": ariaLabel = "Select an option",
  title = "Select an option",
  id,
  ...props
}: ThemedSelectProps) {
  const { title: propsTitle, "aria-label": propsAriaLabel, id: propsId, ...restProps } = props
  const finalTitle = title || propsTitle || "Select an option"
  const finalAriaLabel = ariaLabel || propsAriaLabel || "Select an option"
  const finalId = id || propsId
  
  return (
    <select
      id={finalId}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={finalAriaLabel}
      title={finalTitle}
      onFocus={(e) => {
        e.target.style.borderColor = "var(--chakra-colors-border-focused)"
        e.target.style.boxShadow = "0 0 0 1px var(--chakra-colors-border-focused)"
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "var(--chakra-colors-input-border)"
        e.target.style.boxShadow = "none"
      }}
      style={{
        width: "100%",
        padding: "0.5rem 0.75rem",
        borderRadius: "0.375rem",
        border: "1px solid",
        backgroundColor: "var(--chakra-colors-input-bg)",
        borderColor: "var(--chakra-colors-input-border)",
        color: "var(--chakra-colors-text-primary)",
        fontSize: "1rem",
        outline: "none",
        cursor: "pointer",
      }}
      {...restProps}
    >
      {children}
    </select>
  )
}


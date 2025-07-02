"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

// Define our own Payload type to match Recharts' internal type
type Payload = {
  name?: string
  value?: number
  color?: string
  dataKey: string | number | ((obj: any) => any) | undefined
}

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

interface ChartConfig {
  [key: string]: {
    label?: string
    color?: string
    theme?: Record<keyof typeof THEMES, string>
  }
}

interface ChartContextProps {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

export function useChart() {
  const context = React.useContext(ChartContext)
  if (context === null) {
    throw new Error("useChart must be used within a ChartContainer")
  }
  return context
}

// Define the type for TooltipProps with proper generic types
interface ChartTooltipProps extends RechartsPrimitive.TooltipProps<number, string> {
  className?: string
  indicator?: "line" | "dot" | "dashed"
  formatter?: (value: number) => string
  color?: string
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    active: boolean
    payload: Array<{
      name: string
      value: number
      color?: string
      dataKey: string
    }>
    indicator?: "line" | "dot" | "dashed"
    className?: string
    formatter?: (value: number) => string
    color?: string
  }
>(({
      active,
      payload,
      className,
      indicator = "dot",
      formatter,
      color,
    }, ref) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (!payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${item.dataKey || item.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value = itemConfig?.label

      if (!value) {
        return null
      }

      return <div className="font-medium">{value}</div>
    }, [payload, config])

    if (!active || !payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {tooltipLabel}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${item.dataKey || item.name || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const value = formatter ? formatter(item.value) : item.value
            const color = item.color || (itemConfig?.color ?? undefined)

            return (
              <div key={index} className="flex items-center gap-1.5">
                {indicator && (
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      indicator === "line" && "h-0.5",
                      indicator === "dashed" && "border-2 border-dashed"
                    )}
                    style={{ backgroundColor: color }}
                  />
                )}
                <div className="flex flex-col gap-0.5">
                  <div className="font-medium">
                    {item.name || item.dataKey || "Value"}
                  </div>
                  <div className="text-muted-foreground">{value}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    payload: Array<{
      name?: string
      value?: number
      color?: string
      dataKey: string | number | ((obj: any) => any)
    }>
    verticalAlign?: "top" | "middle" | "bottom"
    hideIcon?: boolean
    nameKey?: string
  }
>(
  ({
    className,
    hideIcon = false,
    payload,
    verticalAlign = "bottom",
    nameKey
  },
  ref) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || (typeof item.dataKey === 'function' ? item.dataKey({}) : String(item.dataKey)) || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value}
              className="flex items-center gap-1.5"
            >
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: item.color || "currentColor",
                }}
              />
              {itemConfig?.label || item.name || "Value"}
            </div>
          )
        })}
      </div>
    )
  }
)

ChartLegendContent.displayName = "ChartLegend"

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: { name?: string; dataKey?: string | number | ((obj: any) => any) },
  key: string
): { label?: string; color?: string } {
  const configKey = payload.name || (typeof payload.dataKey === 'function' ? payload.dataKey({}) : String(payload.dataKey)) || key
  const configValue = config[configKey]
  
  return {
    label: configValue?.label,
    color: configValue?.color
  }
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}

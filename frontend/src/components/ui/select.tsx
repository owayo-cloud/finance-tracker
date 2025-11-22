import { Select as ChakraSelect, Portal } from "@chakra-ui/react"
import * as React from "react"

export interface SelectTriggerProps extends ChakraSelect.TriggerProps {}

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  SelectTriggerProps
>(function SelectTrigger(props, ref) {
  return (
    <ChakraSelect.Trigger {...props} ref={ref}>
      {props.children}
    </ChakraSelect.Trigger>
  )
})

export interface SelectContentProps extends ChakraSelect.ContentProps {
  portalled?: boolean
  portalRef?: React.RefObject<HTMLElement>
}

export const SelectContent = React.forwardRef<
  HTMLDivElement,
  SelectContentProps
>(function SelectContent(props, ref) {
  const { portalled = true, portalRef, ...rest } = props

  return (
    <Portal disabled={!portalled} container={portalRef}>
      <ChakraSelect.Positioner>
        <ChakraSelect.Content {...rest} ref={ref} />
      </ChakraSelect.Positioner>
    </Portal>
  )
})

export const SelectItem = ChakraSelect.Item
export const SelectItemText = ChakraSelect.ItemText
export const SelectRoot = ChakraSelect.Root
export const SelectValueText = ChakraSelect.ValueText
export const SelectLabel = ChakraSelect.Label
export const SelectItemGroup = ChakraSelect.ItemGroup
export const SelectItemGroupLabel = ChakraSelect.ItemGroupLabel

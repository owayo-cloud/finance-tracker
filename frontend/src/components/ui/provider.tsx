"use client"

import { ChakraProvider } from "@chakra-ui/react"
import { type PropsWithChildren } from "react"
import { system } from "../../theme"
import { ColorModeProvider } from "./color-mode"
import { Toaster } from "./toaster"

export function CustomProvider(props: PropsWithChildren) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider 
        defaultTheme="dark"
        forcedTheme={undefined}
        storageKey="chakra-ui-color-mode"
      >
        {props.children}
      </ColorModeProvider>
      <Toaster />
    </ChakraProvider>
  )
}

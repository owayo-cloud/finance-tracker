import { useEffect } from "react"

interface PageMetadata {
  title: string
  description?: string
}

const APP_NAME = "WiseManPalace"

export const usePageMetadata = ({ title, description }: PageMetadata) => {
  useEffect(() => {
    // Update document title
    const fullTitle = title ? `${title} | ${APP_NAME}` : APP_NAME
    document.title = fullTitle

    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement("meta")
      metaDescription.setAttribute("name", "description")
      document.head.appendChild(metaDescription)
    }
    if (description) {
      metaDescription.setAttribute("content", description)
    }

    // Cleanup function to restore default title if needed
    return () => {
      document.title = APP_NAME
    }
  }, [title, description])
}

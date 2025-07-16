import type { SVGProps } from "react"

export function VerdantFlowLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2L12 22" />
      <path d="M17 7C17 7 14 12 12 12C10 12 7 7 7 7" />
      <path d="M7 12C7 12 10 17 12 17C14 17 17 12 17 12" />
    </svg>
  )
}

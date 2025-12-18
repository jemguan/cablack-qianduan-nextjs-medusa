import React from "react"

import { IconProps } from "types/icon"

const Moon: React.FC<IconProps> = ({
  size = "20",
  color = "currentColor",
  ...attributes
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <path
        d="M17.2933 13.2933C16.3781 13.8171 15.3051 14.1667 14.1667 14.1667C10.9455 14.1667 8.33334 11.5545 8.33334 8.33334C8.33334 5.195 10.3781 2.60334 13.2933 2.04167C12.6917 1.8575 12.0533 1.76167 11.3917 1.76167C7.17167 1.76167 3.76167 5.17167 3.76167 9.39167C3.76167 13.6117 7.17167 17.0217 11.3917 17.0217C12.0533 17.0217 12.6917 16.9258 13.2933 16.7417C15.2083 16.18 17.2933 14.1342 17.2933 13.2933Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default Moon


import * as core from '@actions/core'
import { Annotation } from './report.js'

const byteLimit = 65535
const annotationLimit = 50

export function createOutput({
  title,
  summary,
  annotations
}: {
  title: string
  summary: string
  annotations: Annotation[]
}) {
  title = truncateToMaxBytes(title, 'title', byteLimit)
  summary = truncateToMaxBytes(summary, 'summary', byteLimit)

  if (annotations.length > annotationLimit) {
    core.warning(
      `Annotations are truncated because the limit of ${annotationLimit} was exceeded by ${annotations.length - annotationLimit} annotations.`
    )
    annotations = annotations.slice(0, annotationLimit)
  }

  return {
    title,
    summary,
    annotations
  }
}

function truncateToMaxBytes(str: string, name: string, maxBytes: number): string {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  let byteArray = encoder.encode(str)

  if (byteArray.length <= maxBytes) {
    return str
  }

  core.warning(
    `The ${name} is truncated because the byte limit of ${maxBytes} was exceeded by ${byteArray.length - maxBytes} bytes.`
  )

  byteArray = byteArray.slice(0, maxBytes)

  let truncatedStr = decoder.decode(byteArray)

  while (encoder.encode(truncatedStr).length > maxBytes) {
    truncatedStr = truncatedStr.slice(0, -1)
  }

  return truncatedStr
}

import * as core from '@actions/core'
import { Annotation } from './report.js'

export function createOutput({
  title,
  summary,
  annotations,
  characterLimit = 65535,
  annotationLimit = 50
}: {
  title: string
  summary: string
  annotations: Annotation[]
  characterLimit?: number
  annotationLimit?: number
}) {
  if (title.length > characterLimit) {
    title = title.slice(0, characterLimit)
    core.warning(
      `The title is truncated because the character limit of ${characterLimit} was exceeded.`
    )
  }

  if (summary.length > characterLimit) {
    summary = summary.slice(0, characterLimit)
    core.warning(
      `The summary is truncated because the character limit of ${characterLimit} was exceeded.`
    )
  }

  if (annotations.length > annotationLimit) {
    annotations = annotations.slice(0, annotationLimit)
    core.warning(`Annotations are truncated because the limit of ${annotationLimit} was exceeded.`)
  }

  return {
    title,
    summary,
    annotations
  }
}

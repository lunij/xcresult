import { describe, expect, it, jest } from '@jest/globals'
import { createOutput } from '../src/output.js'
import { Annotation } from '../src/report.js'
import * as core from '@actions/core'

jest.mock('@actions/core', () => ({
  warning: jest.fn()
}))

describe('createOutput', () => {
  it('should truncate title and summary if they exceed character limit', () => {
    const result = createOutput({
      title: 'a'.repeat(65536),
      summary: 'b'.repeat(65536),
      annotations: []
    })

    expect(result.title.length).toBe(65535)
    expect(result.summary.length).toBe(65535)
  })

  it('should truncate annotations if they exceed annotation limit', () => {
    const annotations = Array(100).fill({ path: 'fakePath', message: 'fakeMessage' })

    const result = createOutput({
      title: 'Fake Title',
      summary: 'Fake Summary',
      annotations
    })

    expect(result.annotations.length).toBe(50)
  })

  it('should not truncate if limits are not exceeded', () => {
    const result = createOutput({
      title: 'Fake Title',
      summary: 'Fake Summary',
      annotations: [new Annotation('fakePath', 0, 0, 'failure', 'fakeMessage')]
    })

    expect(result.title).toBe('Fake Title')
    expect(result.summary).toBe('Fake Summary')
    expect(result.annotations.length).toBe(1)
  })
})

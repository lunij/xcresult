import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import * as os from 'os'
import * as path from 'path'
import { Formatter } from './formatter.js'
import { uploadBundlesAsArtifacts } from './upload.js'
import { Octokit } from '@octokit/action'
import { promises } from 'fs'
const { stat } = promises

async function run(): Promise<void> {
  try {
    const inputPaths = core.getMultilineInput('path')
    const showPassedTests = core.getBooleanInput('show-passed-tests')
    const showCodeCoverage = core.getBooleanInput('show-code-coverage')
    const showFileCoverage = core.getBooleanInput('show-file-coverage')
    const showTestSummaries = core.getBooleanInput('show-test-summaries')
    const uploadOption = core.getInput('upload').toLowerCase()

    const bundlePaths: string[] = []
    for (const checkPath of inputPaths) {
      try {
        await stat(checkPath)
        bundlePaths.push(checkPath)
      } catch (error) {
        core.error((error as Error).message)
      }
    }
    let bundlePath = path.join(os.tmpdir(), 'Merged.xcresult')
    if (inputPaths.length > 1) {
      await mergeResultBundle(bundlePaths, bundlePath)
    } else {
      const inputPath = inputPaths[0]
      await stat(inputPath)
      bundlePath = inputPath
    }

    const formatter = new Formatter(bundlePath)
    const report = await formatter.format({
      showPassedTests,
      showCodeCoverage,
      showFileCoverage,
      showTestSummaries
    })

    if (core.getInput('token')) {
      const octokit = new Octokit()

      const owner = github.context.repo.owner
      const repo = github.context.repo.repo

      const pr = github.context.payload.pull_request
      const sha = (pr && pr.head.sha) || github.context.sha

      const characterLimit = 65535
      const annotationLimit = 50

      let title = core.getInput('title')
      if (title.length > characterLimit) {
        title = title.slice(0, characterLimit)
        core.warning(`The title is truncated because the character limit of ${characterLimit} was exceeded.`)
      }

      let summary = report.summary
      if (summary.length > characterLimit) {
        summary = summary.slice(0, characterLimit)
        core.warning(`The summary is truncated because the character limit of ${characterLimit} was exceeded.`)
      }

      let annotations = report.annotations
      if (annotations.length > annotationLimit) {
        annotations = annotations.slice(0, annotationLimit)
        core.warning(`Annotations are truncated because the limit of ${annotationLimit} was exceeded.`)
      }

      const output = {
        title,
        summary,
        annotations
      }
      await octokit.checks.create({
        owner,
        repo,
        name: title,
        head_sha: sha,
        status: 'completed',
        conclusion: 'neutral',
        output
      })

      await core.summary.addRaw(summary).write()
      uploadBundlesAsArtifacts(inputPaths, uploadOption, report.testStatus)
    }
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

run()

async function mergeResultBundle(inputPaths: string[], outputPath: string): Promise<void> {
  const args = ['xcresulttool', 'merge'].concat(inputPaths).concat(['--output-path', outputPath])
  const options = {
    silent: true
  }

  await exec.exec('xcrun', args, options)
}

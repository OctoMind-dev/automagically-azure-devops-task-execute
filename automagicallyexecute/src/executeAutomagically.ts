import {setTimeout} from 'node:timers'
import {fetchJson} from './fetchJson.js'
import {ExecuteResponse, TestReport} from './types.js'
import {
  debug,
  getBoolInput,
  getEndpointAuthorizationParameter,
  getInput,
  getDelimitedInput,
  getInputRequired,
  getVariable,
  setResult,
  TaskResult,
  warning
} from 'azure-pipelines-task-lib'

const TIME_BETWEEN_POLLS_MILLISECONDS = 5_000
const MAXIMUM_POLL_TIME_MILLISECONDS = 2 * 60 * 60 * 1000
const DEFAULT_URL = 'https://app.octomind.dev'

const sleep = (timeInMilliseconds: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, timeInMilliseconds))

const getExecuteUrl = (automagicallyUrl: string) =>
  `${automagicallyUrl}/api/apiKey/v2/execute`

const getTestReportApiUrl = (
  automagicallyUrl: string,
  testTargetId: string,
  testReportId: string
) =>
  `${automagicallyUrl}/api/apiKey/v2/test-targets/${testTargetId}/test-reports/${testReportId}`

export const executeAutomagically = async ({
  pollingIntervalInMilliseconds = TIME_BETWEEN_POLLS_MILLISECONDS,
  maximumPollingTimeInMilliseconds = MAXIMUM_POLL_TIME_MILLISECONDS
}: {
  pollingIntervalInMilliseconds?: number
  maximumPollingTimeInMilliseconds?: number
} = {}): Promise<void> => {
  const url = getInputRequired('url')
  const token = getInputRequired('token')
  const testTargetId = getInputRequired('testTargetId')
  const environmentName = getInput('environmentName')
  const tags = getDelimitedInput('tags', '\n')

  const blocking = getBoolInput('blocking')
  // https://learn.microsoft.com/en-us/azure/devops/pipelines/build/variables
  const collectionUri = getVariable('System.TeamFoundationCollectionUri')

  const context = {
    organization: collectionUri
      ? new URL(collectionUri).pathname.split('/').at(1)
      : undefined,
    project: getVariable('System.TeamProject'),
    repositoryId: getVariable('Build.Repository.ID'),
    pullRequestId: getVariable('System.PullRequest.PullRequestId'),
    sha: getVariable('Build.SourceVersion'),
    ref: getVariable('Build.SourceBranch')
  }

  if (!context.pullRequestId) {
    warning(
      'System.PullRequest.PullRequestId variable not available. ' +
        'Make sure you run this task in a PR build validation pipeline ' +
        'if you want to see automatic comments with your test results'
    )
  }

  const urlDefault = 'https://app.octomind.dev/'
  const urlOverride = getInput('automagicallyUrl', false) ?? ''
  const automagicallyUrl = urlOverride.length === 0 ? urlDefault : DEFAULT_URL

  const executeUrl = getExecuteUrl(automagicallyUrl)

  debug(JSON.stringify({executeUrl, context}, null, 2))

  // https://github.com/microsoft/azure-pipelines-task-lib/issues/579
  const accessToken = getEndpointAuthorizationParameter(
    'SystemVssConnection',
    'AccessToken',
    false
  )

  try {
    const executeResponse = await fetchJson<ExecuteResponse>({
      url: getExecuteUrl(automagicallyUrl),
      method: 'POST',
      token,
      body: JSON.stringify({
        url,
        testTargetId,
        environmentName,
        tags,
        context: {
          source: 'azureDevOps',
          accessToken,
          ...context
        }
      })
    })

    const testReportUrl = executeResponse.testReportUrl

    if (blocking) {
      let currentStatus = executeResponse.testReport.status
      const start = Date.now()
      let now = start

      while (
        currentStatus === 'WAITING' &&
        now - start < maximumPollingTimeInMilliseconds
      ) {
        const testReport = await fetchJson<TestReport>({
          method: 'GET',
          token,
          url: getTestReportApiUrl(
            automagicallyUrl,
            testTargetId,
            executeResponse.testReport.id
          )
        })
        currentStatus = testReport.status

        await sleep(pollingIntervalInMilliseconds)
        now = Date.now()
      }

      if (currentStatus !== 'PASSED') {
        setResult(
          TaskResult.Failed,
          `some test results failed, check your test report at ${testReportUrl} to find out more.`
        )
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      setResult(
        TaskResult.Failed,
        `unable to execute automagically:  ${
          typeof error.message === 'object'
            ? JSON.stringify({
                error: error.message
              })
            : error.message
        }`
      )
    } else {
      setResult(
        TaskResult.Failed,
        `unable to execute automagically: unknown error`
      )
    }
  }
}

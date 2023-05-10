import tl from 'azure-pipelines-task-lib'

import fetch from 'node-fetch'

const run = async (): Promise<void> => {
  try {
    const url = tl.getInputRequired('url')
    if (!url) {
      tl.setResult(tl.TaskResult.Failed, 'URL is required')
      return
    }

    const token = tl.getInputRequired('token')
    if (!token) {
      tl.setResult(tl.TaskResult.Failed, 'token is required')
      return
    }

    const response = await fetch(
      'https://automagically-5vr3ysri3a-ey.a.run.app/api/v1/execute',
      {
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({token, url}),
        method: 'POST'
      }
    )

    if (!response.ok) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(
        `response not ok ${response.status}, body: ${await response.json()}`
      )
    }
  } catch (err) {
    tl.setResult(
      tl.TaskResult.Failed,
      err &&
        typeof err === 'object' &&
        'message' in err &&
        typeof err.message === 'string'
        ? `unable to execute automagically: ${err.message}`
        : 'Unknown Error'
    )
  }
}

await run()

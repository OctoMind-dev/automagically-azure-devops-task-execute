import {executeAutomagically} from '../src/executeAutomagically'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {fetchJson} from '../src/fetchJson'
import {
  getBoolInput,
  getDelimitedInput,
  getEndpointAuthorizationParameter,
  getInput,
  getInputRequired,
  getVariable,
  setResult,
  TaskResult
} from 'azure-pipelines-task-lib'

vi.mock('../src/fetchJson')
vi.mock('azure-pipelines-task-lib')

describe(executeAutomagically.name, () => {
  beforeEach(() => {
    vi.mocked(getInput).mockReturnValue('some input')
    vi.mocked(getBoolInput).mockReturnValue(false)
    vi.mocked(getInputRequired).mockReturnValue('required input')
    vi.mocked(getVariable).mockReturnValue('https://someUrl.com')
    vi.mocked(getEndpointAuthorizationParameter).mockReturnValue(
      'authorization parameter'
    )
  })

  it('includes environment name if defined', async () => {
    const environmentName = 'staging'
    vi.mocked(getInput).mockReturnValue(environmentName)

    await executeAutomagically()

    expect(fetchJson).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST'
      })
    )

    const sentBody = JSON.parse(
      vi.mocked(fetchJson).mock.calls[0][0].body as string
    )

    expect(sentBody).toEqual(
      expect.objectContaining({
        environmentName
      })
    )
    expect(getInput).toHaveBeenCalledWith('environmentName')
  })

  it('includes browser if defined', async () => {
    const browserName = 'FIREFOX'
    vi.mocked(getInput).mockReturnValue(browserName)

    await executeAutomagically()

    expect(fetchJson).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST'
      })
    )

    const sentBody = JSON.parse(
      vi.mocked(fetchJson).mock.calls[0][0].body as string
    )

    expect(sentBody).toEqual(
      expect.objectContaining({
        browser: browserName
      })
    )
    expect(getInput).toHaveBeenCalledWith('browser')
  })

  it('includes breakpoint if defined', async () => {
    const breakpoint = 'MOBILE'
    vi.mocked(getInput).mockReturnValue(breakpoint)

    await executeAutomagically()

    expect(fetchJson).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST'
      })
    )

    const sentBody = JSON.parse(
      vi.mocked(fetchJson).mock.calls[0][0].body as string
    )

    expect(sentBody).toEqual(
      expect.objectContaining({
        breakpoint
      })
    )
    expect(getInput).toHaveBeenCalledWith('breakpoint')
  })

  it('includes variablesToOverwrite name if defined and preserves colons in the values', async () => {
    const variablesToOverwrite = ['key1:value1', 'key2:value:2']
    vi.mocked(getDelimitedInput).mockReturnValue(variablesToOverwrite)

    await executeAutomagically()

    expect(fetchJson).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST'
      })
    )

    const sentBody = JSON.parse(
      vi.mocked(fetchJson).mock.calls[0][0].body as string
    )

    expect(sentBody).toEqual(
      expect.objectContaining({
        variablesToOverwrite: {
          key1: ['value1'],
          key2: ['value:2']
        }
      })
    )
    expect(getDelimitedInput).toHaveBeenCalledWith('variablesToOverwrite', '\n')
  })

  it("executes and DOESN'T wait if it's not blocking", async () => {
    await executeAutomagically()

    expect(fetchJson).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST'
      })
    )
    expect(fetchJson).toHaveBeenCalledTimes(1)
  })

  it('executes and waits until passing while blocking', async () => {
    vi.mocked(getBoolInput).mockReturnValue(true)

    // execute
    vi.mocked(fetchJson).mockResolvedValueOnce({
      testReport: {
        status: 'WAITING'
      }
    })
    // poll 1
    vi.mocked(fetchJson).mockResolvedValueOnce({
      status: 'WAITING'
    })
    // poll 2
    vi.mocked(fetchJson).mockResolvedValueOnce({
      status: 'WAITING'
    })
    // poll 3
    vi.mocked(fetchJson).mockResolvedValueOnce({
      status: 'PASSED'
    })

    await executeAutomagically({pollingIntervalInMilliseconds: 1})

    expect(fetchJson).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST'
      })
    )
    expect(fetchJson).toHaveBeenCalledTimes(4)
  })

  it('sets to failed if a request throws', async () => {
    vi.mocked(fetchJson).mockRejectedValue(new Error('not successful'))

    await executeAutomagically()

    expect(setResult).toHaveBeenCalledWith(TaskResult.Failed, expect.anything())
  })

  it('sets to failed if a polling request throws', async () => {
    vi.mocked(getBoolInput).mockReturnValue(true)
    // execute
    vi.mocked(fetchJson).mockResolvedValueOnce({
      testReport: {
        status: 'WAITING'
      }
    })
    vi.mocked(fetchJson).mockRejectedValue(new Error('not successful'))

    await executeAutomagically({pollingIntervalInMilliseconds: 1})

    expect(setResult).toHaveBeenCalledWith(TaskResult.Failed, expect.anything())
  })

  it('sets to failed if polling returns FAILED', async () => {
    vi.mocked(getBoolInput).mockReturnValue(true)
    // execute
    vi.mocked(fetchJson).mockResolvedValueOnce({
      testReport: {
        status: 'WAITING'
      }
    })
    vi.mocked(fetchJson).mockResolvedValueOnce({
      status: 'FAILED'
    })

    await executeAutomagically({pollingIntervalInMilliseconds: 1})

    expect(setResult).toHaveBeenCalledWith(TaskResult.Failed, expect.anything())
  })

  it('sets to failed if polling never stops', async () => {
    vi.mocked(getBoolInput).mockReturnValue(true)
    // execute
    vi.mocked(fetchJson).mockResolvedValueOnce({
      testReport: {
        status: 'WAITING'
      }
    })
    vi.mocked(fetchJson).mockResolvedValue({
      status: 'WAITING'
    })

    await executeAutomagically({
      pollingIntervalInMilliseconds: 1,
      maximumPollingTimeInMilliseconds: 5
    })

    expect(setResult).toHaveBeenCalledWith(TaskResult.Failed, expect.anything())
  })
})
